// script to create a sqlite database that contains our inpatient costs
var sqlite3 = require('sqlite3')
    .verbose();
var fs = require('fs');
var papaparse = require('papaparse');
var baby = require('babyparse');
var Promise = require('bluebird');

var geocoder = require("geocoder");




// initialize the database
// Knex: sqlite query builder
var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./providers.sqlite"
    },
    useNullAsDefault: true
});

// create database
knex.schema.createTableIfNotExists('procedures', function(table) {
        table.increments('id');
        table.string('provider_id');
        table.string('provider_name');
        table.string('street_address');
        table.string('city');
        table.string('state');
        table.string('zipcode');
        table.float('lat');
        table.float('lng');
    })
    .catch(function(error) {
        console.error(error);
    });

fs.readFile('providers-mini.csv', function(err, data) {
    // load & parse the whole file into memory
    var parsed = baby.parse(data.toString(), {
        header: true
    });

    var rows = parsed.data;
    var cleanedRows = rows.map(function(rawObject) {
        return {
            'provider_id': rawObject["Provider Id"],
            'provider_name': rawObject["Provider Name"],
            'street_address': rawObject["Provider Street Address"],
            'city': rawObject["Provider City"],
            'state': rawObject["Provider State"],
            'zipcode': rawObject["Provider Zip Code"],
        };
    });

    // Calculate lat/long for each of these
    var locationPromises = cleanedRows.forEach(function(row, index){
        // TODO stagger these with a timeout so that they don't time out
        // IDK if i'm doing this right
        return Promise.delay(index*1000, new Promise(function(resolve, reject){
            var address = row.street_address + ", " + row.city + ", " + row.state + " " + row.zipcode;
            geocoder.geocode(address, function ( err, data ) {
              // add the location data to the row object, and return it
              if (!(data.results[0])) {
                  console.log("nothing for", address);
                  console.log(data);
              }
              if (err) {
                  reject(err);
              }
              else {
                  var location = data.results[0].geometry.location;
                  row.lat = location.lat;
                  row.lng = location.lng;
                  resolve(row);
              }
            });
        }));
    });

    Promise.all(locationPromises).then(function(promiseData){
        console.log(promiseData);
    });

    // knex.batchInsert('procedures', cleanedRows, 10)
    //     .returning('id')
    //     .then(function(ids) {
    //         // do something
    //         console.log("Done with end ids=", ids);
    //     })
    //     .catch(function(error) {
    //         console.error(error);
    //     });

});
