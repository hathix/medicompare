// script to create a sqlite database that contains our inpatient costs
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var papaparse = require('papaparse');
var baby = require('babyparse');


// initialize the database
// Knex: sqlite query builder
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./inpatient-costs.sqlite"
},
useNullAsDefault: true
});

// create database
knex.schema.createTableIfNotExists('procedures', function (table) {
  table.increments('id');
  table.string('drg_definition');
  table.string('provider_id');
  table.string('provider_name');
  table.string('street_address');
  table.string('city');
  table.string('state');
  table.string('zipcode');
  table.string('hospital_referral_region');
  table.integer('total_discharges');
  table.float('average_covered_charges');
  table.float('average_total_payments');
  table.float('average_medicare_payments');
})
.catch(function(error){
    console.error(error);
});

fs.readFile('inpatient-costs.csv', function(err, data) {
    // load & parse the whole file into memory
    var parsed = baby.parse(data.toString(), {
        header: true
    });

    var rows = parsed.data;
    var cleanedRows = rows.map(function(rawObject){
        return {
            "drg_definition": rawObject["DRG Definition"],
          'provider_id': rawObject["Provider Id"],
          'provider_name': rawObject["Provider Name"],
          'street_address': rawObject["Provider Street Address"],
          'city': rawObject["Provider City"],
          'state': rawObject["Provider State"],
          'zipcode': rawObject["Provider Zip Code"],
          'hospital_referral_region': rawObject["Hospital Referral Region Description"],
          'total_discharges': parseInt(rawObject[" Total Discharges "]),
          'average_covered_charges': parseMoney(rawObject[" Average Covered Charges "]),
          'average_total_payments': parseMoney(rawObject[" Average Total Payments "]),
          'average_medicare_payments': parseMoney(rawObject["Average Medicare Payments"])
        };
    });

    knex.batchInsert('procedures', cleanedRows, 10)
        .returning('id')
        .then(function(ids){
            // do something
            console.log("Done with end ids=", ids);
        })
        .catch(function(error){
            console.error(error);
        });

});

// UTILITIES

// "$1234.56" => 1234.56
function parseMoney(moneyString) {
    if (!moneyString) {
        return 0;
    }
    return parseFloat(moneyString.replace("$",""));
}
