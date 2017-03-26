var zipcodes = require('zipcodes');
var sqlite3 = require('sqlite3')
    .verbose();
var Promise = require("bluebird");


// initialize the database connection
// Knex: sqlite query builder
var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "data/inpatient-costs.sqlite"
    },
    useNullAsDefault: true
});


var exports;

/**
 * Queries SQLite to find procedure cost data near a given location.
 * @param  {string} procedure   The name of a procedure; see the list in `inpatient-costs.csv`.
 * @param  {string} zip     Make sure it's 5 digits long ("02138" instead of "2138")
 * @param  {int} radius     in miles
 * @return {Promise}       a promise that resolves to a list of similar procedures near a given location.
 */
exports.findNearbyProcedureData = function(procedure, zip, radius) {
    // find zip codes nearby
    var nearbyZips = zipcodes.radius(zip, radius);

    // our database stores "0xxxx" zipcodes as just "xxxx" so we need to
    // remove those
    var fixedZips = nearbyZips.map(function(zip){
        return parseInt(zip) + "";
    });

    // now find all the data on procedures in nearby zip codes
    var promise = knex.select()
        .from('procedures')
        .whereIn('zipcode', fixedZips)
        .andWhere('drg_definition', procedure);

    return promise;
}


// example usage
// findNearbyProcedureData("039 - EXTRACRANIAL PROCEDURES W/O CC/MCC", "36608", 100)
//     .then(function(data){
//         console.log(data);
//     })
//     .catch(function(error){
//         console.error(error);
//     });


/**
 * Returns the latitude, longitude, city, and state of a given zipcode.
 * @param  {string} zipcode
 * @return {Object}           see https://www.npmjs.com/package/zipcodes for schema
 */
exports.zipcodeLookup = function(zipcode) {
    return zipcodes.lookup(zipcode);
}


/**
 * Returns an object showing the average cost in the given zipcode's state
 * and across the country.
 * @param  {[type]} procedure [description]
 * @param  {string} procedure   The name of a procedure; see the list in `inpatient-costs.csv`.
 * @param  {string} zipcode     Make sure it's 5 digits long ("02138" instead of "2138")
 * @return {Promise}            A promise that resolves to {state: float, national: float}
 */
exports.comparativeCosts = function(procedure, zipcode) {
    // figure out which state it's in
    var state = zipcodes.lookup(zipcode).state;
    // state price

}



module.exports = exports;
