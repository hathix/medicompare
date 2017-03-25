// script to create a sqlite database that contains our inpatient costs
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var papaparse = require('papaparse');


// initialize the database
// KNEX: sqlite query builder
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./inpatient-costs.sqlite"
},
useNullAsDefault: true
});
// var db = new sqlite3.Database('inpatient-costs.sqlite');

// create database
knex.schema.createTableIfNotExists('procedures', function (table) {
  table.increments();
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
.then(function(x){
    console.log(x);
});


// set up the csv reader
// TODO using the mini csv, switch to using the full one
var readStream = fs.createReadStream('inpatient-costs-mini.csv');
papaparse.parse(readStream, {
    header: true,
    step: function(row) {
        // JSON object of each row
        // e.g.
          //       { 'DRG Definition': '057 - DEGENERATIVE NERVOUS SYSTEM DISORDERS W/O MCC',
          // 'Provider Id': '360035',
          // 'Provider Name': 'MOUNT CARMEL HEALTH',
          // 'Provider Street Address': '793 WEST STATE STREET',
          // 'Provider City': 'COLUMBUS',
          // 'Provider State': 'OH',
          // 'Provider Zip Code': '43222',
          // 'Hospital Referral Region Description': 'OH - Columbus',
          // ' Total Discharges ': '34',
          // ' Average Covered Charges ': '$8976.64',
          // ' Average Total Payments ': '$5725.47',
          // 'Average Medicare Payments': '$4838.97' }
        var rawObject = row.data[0];
        // clean up row object so field names and data types are right
        var cleanedObject = {
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

        // put it in the table
    },
    complete: function() {
        // finish up
        console.log("Done");
    }
});



// "$1234.56" => 1234.56
function parseMoney(moneyString) {
    return parseFloat(moneyString.replace("$",""));
}
