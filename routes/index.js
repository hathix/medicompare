var express = require('express');
var router = express.Router();

var zipcodes = require('zipcodes');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Medicompare' });
});

router.get('/search', function(req, res, next) {
	var zipcode = req.query['zipcode'];
	var procedure = req.query['procedure'];
    console.log(findNearbyProcedureData(procedure, zipcode, 10));
	res.render('index', { title: 'Medicompare', zipcode: zipcode, procedure: procedure });
})

module.exports = router;



/**
 * Queries SQLite to find procedure cost data near a given location.
 * @param  {string} procedure   The name of a procedure; see the list in `inpatient-costs.csv`.
 * @param  {string} zip     Make sure it's 5 digits long ("02138" instead of "2138")
 * @param  {int} radius     in miles
 * @return {Object[]}       a list of procedure cost data (as read from 'inpatient-costs.csv'.)
 */
function findNearbyProcedureData(procedure, zip, radius) {
    // find zip codes nearby
    nearbyZips = zipcodes.radius(zip, radius);
	return nearbyZips;
}
