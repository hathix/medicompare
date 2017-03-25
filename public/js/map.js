function initMap() {
	var mapProp = {
    	center: new google.maps.LatLng{-25.363, 131.044},
    	zoom: 5
    };
	var map = new google.maps.Map(document.getElementById("gMap"), mapProp);
};