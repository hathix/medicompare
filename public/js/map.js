// create map view
var map;
var geocoder;
var priceStyle = ""

function initMap() {
	var mapProp = {
        center: new google.maps.LatLng(42.342104, -71.065755),
        zoom: 10
    };
    map = new google.maps.Map(document.getElementById("gMap"), mapProp);
    geocoder = new google.maps.Geocoder();
};

function addMarker(procedure) {
    var address = procedure.street_address + ", " + procedure.city + ", " + procedure.state + " " + procedure.zipcode;
    console.log(address);
    geocoder.geocode( { 'address': address }, function(results, status) {
        if (status == 'OK') {
            var marker = new google.maps.Marker({
                position: results[0].geometry.location,
                map: map,
                title: procedure.provider_name,
                // icon: {
                //     url: "http://maps.google.com/mapfiles/kml/pal2/icon31.png",
                //     labelOrigin: new google.maps.Point(25, 40)
                // }
            });
            var contentString = '<div id="info">' + '<div class="infoTitle" style="font-weight:bold">' + procedure.provider_name + '</div>' + '<div class="infoAddress">' + address + '</div>' + '<div class="infoPrice">' + 'Cost: $' + procedure.average_total_payments + '</div>' + '</div>';
            var infoWindow = new google.maps.InfoWindow({
                // details https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple
                content: contentString
            });

            marker.addListener('click', function(){
                infoWindow.open(map, marker);
            })
        } else {
            console.error('Geocode error', status);
        }
    });
}


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

        // fire off an ajax request to get the procedure data
        $.getJSON({
                url: "/procedures",
                data: {
                    zipcode: $('#input-zipcode').val(),
                    procedure: $('#input-procedure').val()
                }
            })
            .done(function(data) {
                // these are the nearby treatments
                console.log(data);
                data.forEach(function(procedure){
                    addMarker(procedure);
                });
            })
            .fail(function(error) {
                console.error(error);
            });

function doSearch(){
    // TODO data validation

    // fire off an ajax request to get the procedure data
    $.getJSON({
            url: "/procedures",
            data: {
                zipcode: $('#input-zipcode').val(),
                procedure: $('#input-procedure').val()
            }
        })
        .done(function(data) {
            // these are the nearby treatments
            drawProcedureData(data);
        })
        .fail(function(error) {
            console.error(error);
        });
}

/**
 * Given procedure data, draws it on the map and in the sidebar.
 */
function drawProcedureData(data){
    // sort procedures by cost
    data.sort(function(a,b){
        return a.average_total_payments - b.average_total_payments;
    });
    // attach a rank to them (for the map's purposes)
    // TODO

    // draw markers on map
    data.forEach(function(procedure){
        addMarker(procedure);
    });

    // draw in sidebar
    // TODO
    // or do a bar chart
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
