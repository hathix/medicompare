// create map view
var map;
var geocoder;
var markers = [];
var infoWindow;

function initMap() {
	var mapProp = {
        center: new google.maps.LatLng(42.342104, -71.065755),
        zoom: 9
    };
    map = new google.maps.Map(document.getElementById("gMap"), mapProp);
    geocoder = new google.maps.Geocoder();
    infoWindow = new google.maps.InfoWindow({
        // details https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple
    });
};


function addMarker(procedure, color) {
    var address = addressOfProcedure(procedure);
    geocoder.geocode( { 'address': address }, function(results, status) {
        if (status === 'OK') {
            console.log(procedure.provider_name);
            var marker = new google.maps.Marker({
                position: results[0].geometry.location,
                map: map,
                title: procedure.provider_name,
                icon: {
                    url: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2%7C" + color,
                    // labelOrigin: new google.maps.Point(25, 40)
                }
            });
            markers.push(marker);
            var contentString = '<div id="info">' + '<div class="infoTitle" style="font-weight:bold">' + procedure.provider_name + '</div>' + '<div class="infoAddress">' + address + '</div>' + '<div class="infoPrice">' + 'Cost: ' + formatMoney(procedure.average_total_payments) + '</div>' + '</div>';

            marker.addListener('click', function(){
                try{
                    infoWindow.close();
                }
                catch(error) {}

                infoWindow.setContent(contentString);

                infoWindow.open(map, marker);
            })
        } else {
            console.error('Geocode error', status);
        }
    });
}


var barGraph;
$(document).ready(function(){
    barGraph = new BarGraph("bar-graph");
    $('#care-stats').hide();
});


$('#search-submit')
    .on('click', doSearch);
$('#input-zipcode')
    .on('keypress', function(event) {
            // search if someone hits 'enter' on the zipcode search field
            if (event.which == 13 || event.keyCode == 13) {
                doSearch();
                return false;
            }
            return true;
        });


function doSearch(){
    // TODO data validation
    var zipcode = $('#input-zipcode').val();
    var procedure = $('#input-procedure').val();

    // update the map to the zipcode where they searched from
    // geocoder.geocode( { 'address': zipcode }, function(results, status) {
    //     if (status === 'OK') {
    //         // TODO store the results here and share with the loadProcedureData, who wants to show info on the sidebar
    //         map.panTo(results[0].geometry.location);
    //     } else {
    //         console.error('Geocode error', status);
    //     }
    // });

    // reset map - remove all markers
    markers.forEach(function(marker){
        marker.setMap(null);
    });
    markers = [];


    // figure out which state and lat/long they're at
    // fire off an ajax request to get the procedure data
    var locationAjax = $.getJSON({
            url: "/zipcode",
            data: {
                zipcode: zipcode
            }
        });

    // fire off an ajax request to get the procedure data
    var procedureAjax = $.getJSON({
            url: "/procedures",
            data: {
                zipcode: zipcode,
                procedure: procedure
            }
        });

    // state/national average price data
    var priceAjax = $.getJSON({
        url: "/averages",
        data: {
            zipcode: zipcode,
            procedure: procedure
        }
    });

    // wait for all to resolve
    $.when(locationAjax, procedureAjax, priceAjax).done(function(locationResult, procedureResult, priceResult){
        // a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
        // Each argument is an array with the following structure: [ data, statusText, jqXHR ]
        var locationData = locationResult[0];
        var procedureData = procedureResult[0];
        var priceData = priceResult[0];

        loadProcedureData(procedure, zipcode, locationData, procedureData, priceData);
    })
    .fail(function(error) {
        console.error(error);
    });
}

/**
 * Given procedure price data, draws it on the map and in the sidebar.
 */
function loadProcedureData(procedure, zipcode, location, procedureData, priceData){
    // sort procedures by cost
    procedureData.sort(function(a,b){
        return a.average_total_payments - b.average_total_payments;
    });


    // fix up some of the data. e.g. zipcodes are messed up ("2138" instead of "02138")
    procedureData.forEach(function(procedure) {
		// pad zipcode to 5 digits
		procedure.zipcode = ("00000" + procedure.zipcode).slice(-5);
	});

    // draw markers on map
    // determine their colors
    // first, find min/max/midpoint of prices
    var extent = d3.extent(procedureData.map(function(d){
        return d.average_total_payments;
    }));
    var min = extent[0];
    var max = extent[1];
    var mid = (min + max) / 2;

    var colorScale = d3.scale.linear()
        .domain([min, mid, max])
        .range(["green", "yellow", "red"]);


    // update the map to the zipcode where they searched from
    map.panTo(new google.maps.LatLng(location.latitude, location.longitude));


    // run on each data element
    // namely, draw a pin
    var eachDataFunction = function(procedure){
        // use the scale to determine the pin color
        var color = colorScale(procedure.average_total_payments).replace("#", "");
        // console.log(color);
        addMarker(procedure, color);
    };

    procedureData.forEach(function(procedure, index){
        window.setTimeout(eachDataFunction.bind(null, procedure), index*500);
    });

    // draw in sidebar
    $('#care-stats').show();
    $('#care-stats-procedure').html(procedure);
    $('#care-stats-place').html(location.city + ", " + location.state);
    $('#lookup-zip').html(zipcode);
    $('#lookup-state').html(location.state);
    $('#average-price-state').html(formatMoney(priceData.stateAverage));
    $('#average-price-national').html(formatMoney(priceData.nationalAverage));

	// find cheapest. procedure data is already sorted
	var cheapest = procedureData[0];
	$('#cheapest-name').html(cheapest.provider_name);
	$('#cheapest-address').html(addressOfProcedure(cheapest));
	$('#cheapest-price').html(formatMoney(cheapest.average_total_payments));

	var priciest = procedureData[procedureData.length - 1];
	$('#priciest-name').html(priciest.provider_name);
	$('#priciest-address').html(addressOfProcedure(priciest));
	$('#priciest-price').html(formatMoney(priciest.average_total_payments));

    // care price stats
    var localPrices = procedureData.map(function(d){ return d.average_total_payments; });
    var averageLocalPrice = d3.mean(localPrices);
    $('#average-price-local').html(formatMoney(averageLocalPrice));

    // do a bar chart
    barGraph.updateVis(procedureData);
}


// set up procedure code search
var drgCodes = ["039 - EXTRACRANIAL PROCEDURES W/O CC/MCC",
    "057 - DEGENERATIVE NERVOUS SYSTEM DISORDERS W/O MCC",
    "069 - TRANSIENT ISCHEMIA",
    "064 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W MCC",
    "065 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W CC",
    "066 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W/O CC/MCC",
    "074 - CRANIAL & PERIPHERAL NERVE DISORDERS W/O MCC",
    "101 - SEIZURES W/O MCC",
    "149 - DYSEQUILIBRIUM",
    "176 - PULMONARY EMBOLISM W/O MCC",
    "177 - RESPIRATORY INFECTIONS & INFLAMMATIONS W MCC",
    "189 - PULMONARY EDEMA & RESPIRATORY FAILURE",
    "178 - RESPIRATORY INFECTIONS & INFLAMMATIONS W CC",
    "190 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W MCC",
    "191 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W CC",
    "193 - SIMPLE PNEUMONIA & PLEURISY W MCC",
    "194 - SIMPLE PNEUMONIA & PLEURISY W CC",
    "192 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W/O CC/MCC",
    "195 - SIMPLE PNEUMONIA & PLEURISY W/O CC/MCC",
    "202 - BRONCHITIS & ASTHMA W CC/MCC",
    "203 - BRONCHITIS & ASTHMA W/O CC/MCC",
    "207 - RESPIRATORY SYSTEM DIAGNOSIS W VENTILATOR SUPPORT 96+ HOURS",
    "238 - MAJOR CARDIOVASC PROCEDURES W/O MCC",
    "252 - OTHER VASCULAR PROCEDURES W MCC",
    "253 - OTHER VASCULAR PROCEDURES W CC",
    "208 - RESPIRATORY SYSTEM DIAGNOSIS W VENTILATOR SUPPORT <96 HOURS",
    "254 - OTHER VASCULAR PROCEDURES W/O CC/MCC",
    "291 - HEART FAILURE & SHOCK W MCC",
    "243 - PERMANENT CARDIAC PACEMAKER IMPLANT W CC",
    "244 - PERMANENT CARDIAC PACEMAKER IMPLANT W/O CC/MCC",
    "246 - PERC CARDIOVASC PROC W DRUG-ELUTING STENT W MCC OR 4+ VESSELS/STENTS",
    "247 - PERC CARDIOVASC PROC W DRUG-ELUTING STENT W/O MCC",
    "249 - PERC CARDIOVASC PROC W NON-DRUG-ELUTING STENT W/O MCC",
    "251 - PERC CARDIOVASC PROC W/O CORONARY ARTERY STENT W/O MCC",
    "280 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W MCC",
    "292 - HEART FAILURE & SHOCK W CC",
    "281 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W CC",
    "282 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W/O CC/MCC",
    "286 - CIRCULATORY DISORDERS EXCEPT AMI, W CARD CATH W MCC",
    "287 - CIRCULATORY DISORDERS EXCEPT AMI, W CARD CATH W/O MCC",
    "293 - HEART FAILURE & SHOCK W/O CC/MCC",
    "300 - PERIPHERAL VASCULAR DISORDERS W CC",
    "301 - PERIPHERAL VASCULAR DISORDERS W/O CC/MCC",
    "303 - ATHEROSCLEROSIS W/O MCC",
    "305 - HYPERTENSION W/O MCC",
    "308 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W MCC",
    "312 - SYNCOPE & COLLAPSE",
    "309 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W CC",
    "310 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W/O CC/MCC",
    "313 - CHEST PAIN",
    "314 - OTHER CIRCULATORY SYSTEM DIAGNOSES W MCC",
    "315 - OTHER CIRCULATORY SYSTEM DIAGNOSES W CC",
    "330 - MAJOR SMALL & LARGE BOWEL PROCEDURES W CC",
    "377 - G.I. HEMORRHAGE W MCC",
    "329 - MAJOR SMALL & LARGE BOWEL PROCEDURES W MCC",
    "372 - MAJOR GASTROINTESTINAL DISORDERS & PERITONEAL INFECTIONS W CC",
    "378 - G.I. HEMORRHAGE W CC",
    "379 - G.I. HEMORRHAGE W/O CC/MCC",
    "389 - G.I. OBSTRUCTION W CC",
    "390 - G.I. OBSTRUCTION W/O CC/MCC",
    "391 - ESOPHAGITIS, GASTROENT & MISC DIGEST DISORDERS W MCC",
    "394 - OTHER DIGESTIVE SYSTEM DIAGNOSES W CC",
    "439 - DISORDERS OF PANCREAS EXCEPT MALIGNANCY W CC",
    "392 - ESOPHAGITIS, GASTROENT & MISC DIGEST DISORDERS W/O MCC",
    "460 - SPINAL FUSION EXCEPT CERVICAL W/O MCC",
    "473 - CERVICAL SPINAL FUSION W/O CC/MCC",
    "418 - LAPAROSCOPIC CHOLECYSTECTOMY W/O C.D.E. W CC",
    "419 - LAPAROSCOPIC CHOLECYSTECTOMY W/O C.D.E. W/O CC/MCC",
    "469 - MAJOR JOINT REPLACEMENT OR REATTACHMENT OF LOWER EXTREMITY W MCC",
    "470 - MAJOR JOINT REPLACEMENT OR REATTACHMENT OF LOWER EXTREMITY W/O MCC",
    "480 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W MCC",
    "481 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W CC",
    "536 - FRACTURES OF HIP & PELVIS W/O MCC",
    "482 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W/O CC/MCC",
    "552 - MEDICAL BACK PROBLEMS W/O MCC",
    "491 - BACK & NECK PROC EXC SPINAL FUSION W/O CC/MCC",
    "563 - FX, SPRN, STRN & DISL EXCEPT FEMUR, HIP, PELVIS & THIGH W/O MCC",
    "602 - CELLULITIS W MCC",
    "603 - CELLULITIS W/O MCC",
    "638 - DIABETES W CC",
    "640 - MISC DISORDERS OF NUTRITION,METABOLISM,FLUIDS/ELECTROLYTES W MCC",
    "682 - RENAL FAILURE W MCC",
    "641 - MISC DISORDERS OF NUTRITION,METABOLISM,FLUIDS/ELECTROLYTES W/O MCC",
    "683 - RENAL FAILURE W CC",
    "684 - RENAL FAILURE W/O CC/MCC",
    "689 - KIDNEY & URINARY TRACT INFECTIONS W MCC",
    "690 - KIDNEY & URINARY TRACT INFECTIONS W/O MCC",
    "811 - RED BLOOD CELL DISORDERS W MCC",
    "698 - OTHER KIDNEY & URINARY TRACT DIAGNOSES W MCC",
    "699 - OTHER KIDNEY & URINARY TRACT DIAGNOSES W CC",
    "812 - RED BLOOD CELL DISORDERS W/O MCC",
    "853 - INFECTIOUS & PARASITIC DISEASES W O.R. PROCEDURE W MCC",
    "885 - PSYCHOSES",
    "870 - SEPTICEMIA OR SEVERE SEPSIS W MV 96+ HOURS",
    "871 - SEPTICEMIA OR SEVERE SEPSIS W/O MV 96+ HOURS W MCC",
    "872 - SEPTICEMIA OR SEVERE SEPSIS W/O MV 96+ HOURS W/O MCC",
    "897 - ALCOHOL/DRUG ABUSE OR DEPENDENCE W/O REHABILITATION THERAPY W/O MCC",
    "948 - SIGNS & SYMPTOMS W/O MCC",
    "917 - POISONING & TOXIC EFFECTS OF DRUGS W MCC",
    "918 - POISONING & TOXIC EFFECTS OF DRUGS W/O MCC"
];


// make a select2 for the procedure dropdown
// map drg codes to a format that select2 likes
var formattedCodes = drgCodes.map(function(code) {
    return {
        id: code,
        text: code
    };
})
$("#input-procedure")
    .select2({
        placeholder: 'DRG Medical Procedure Code',
        // allowClear: true,
        theme: "bootstrap",
        data: drgCodes
    })
    .val(null)
    .trigger('change');


/**
 * Creates a bar graph.
 * @param {string} container ID (no #) of an element to render this in.
 */
function BarGraph(container){
    this.container = container;

    this.initVis();
}

BarGraph.prototype.initVis = function() {
    var vis = this;

    vis.valueLabelWidth = 100; // space reserved for value labels (right)
    vis.barHeight = 20; // height of one bar
    vis.barLabelWidth = 300; // space reserved for bar labels
    vis.barLabelPadding = 5; // padding between bar and bar labels (left)
    vis.gridLabelHeight = 18; // space reserved for gridline labels
    vis.gridChartOffset = 3; // space between start of grid and first bar
    vis.maxBarWidth = 250; // width of the bar with the max value


    // accessor functions
    vis.barLabel = function(d) { return d['provider_name'].replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});; };
    vis.barValue = function(d) { return parseFloat(d['average_total_payments']); };


    // scales
    vis.yScale = d3.scale.ordinal();
    vis.y = function(d, i) { return vis.yScale(i); };
    vis.yText = function(d, i) { return vis.y(d, i) + vis.yScale.rangeBand() / 2; };
    vis.x = d3.scale.linear();
    // svg container element
    vis.chart = d3.select('#' + vis.container).append("svg");

    // bar labels
    vis.labelsContainer = vis.chart.append('g')
      .attr('transform', 'translate(' + (vis.barLabelWidth - vis.barLabelPadding) + ',' + (vis.gridLabelHeight + vis.gridChartOffset) + ')');

    // bars
    vis.barsContainer = vis.chart.append('g')
      .attr('transform', 'translate(' + vis.barLabelWidth + ',' + (vis.gridLabelHeight + vis.gridChartOffset) + ')');

}

BarGraph.prototype.updateVis = function(data) {
    var vis = this;

    var sortedData = data.sort(function(a, b) {
      return d3.ascending(vis.barValue(a), vis.barValue(b));
    });

    // update svg
    vis.chart
        .attr('width', vis.maxBarWidth + vis.barLabelWidth + vis.valueLabelWidth)
        .attr('height', vis.gridLabelHeight + vis.gridChartOffset + sortedData.length * vis.barHeight);

    // update scales
    vis.yScale.domain(d3.range(0, sortedData.length)).rangeBands([0, sortedData.length * vis.barHeight]);
    vis.x.domain([0, d3.max(sortedData, vis.barValue)]).range([0, vis.maxBarWidth]);

    // bar labels
    vis.labelsContainer.selectAll('text').remove();

    vis.labelsContainer.selectAll('text').data(sortedData).enter().append('text')
      .attr('y', vis.yText)
      .attr('stroke', 'none')
      .attr('fill', 'black')
      .attr("dy", ".35em") // vertical-align: middle
      .attr('text-anchor', 'end')
      .text(vis.barLabel);


  // HACK: remove old bars
  vis.barsContainer.selectAll("rect").remove();
  vis.barsContainer.selectAll("text").remove();

  // draw bars
  vis.barsContainer.selectAll("rect").data(sortedData).enter().append("rect")
    .attr('y', vis.y)
    .attr('height', vis.yScale.rangeBand())
    .attr('width', function(d) { return vis.x(vis.barValue(d)); })
    .attr('stroke', 'white')
    .attr('fill', 'steelblue');
  // bar value labels
  vis.barsContainer.selectAll("text").data(sortedData).enter().append("text")
    .attr("x", function(d) { return vis.x(vis.barValue(d)); })
    .attr("y", vis.yText)
    .attr("dx", 3) // padding-left
    .attr("dy", ".35em") // vertical-align: middle
    .attr("text-anchor", "start") // text-align: right
    .attr("fill", "black")
    .attr("stroke", "none")
    .text(function(d) { return formatMoney(vis.barValue(d)); });
}


// formats a float of money as a string
const formatMoney = d3.format("$,.2f");

function addressOfProcedure(procedure) {
	return procedure.street_address + ", " + procedure.city + ", " + procedure.state + " " + procedure.zipcode;
}
