var express = require('express');
var router = express.Router();

var zipcodes = require('zipcodes');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'My app' });
});

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
}
