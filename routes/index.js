var express = require('express');
var router = express.Router();

var api = require('../lib/api');

/* GET home page. */
router.get('/main', function(req, res, next) {
    res.render('index');
});

// GET landing page
router.get('/', function(req, res, next) {
	res.render('landing');
});

// Ajax
// Asynchronously fetch the list of similar procedures near the
// given zip codes. Returns a JSON array.
router.get('/procedures', function(req, res, next) {
    var zipcode = req.query['zipcode'];
    var procedure = req.query['procedure'];

    // get procedure data and return once it's good
    api.findNearbyProcedureData(procedure, zipcode, 25)
        .then(function(data) {
            // success
            res.send(data);
        })
        .catch(function(error) {
            // error
            res.status(500)
                .send(error);
        });
});

// given a zipcode, returns information about its location
router.get('/zipcode', function(req, res, next) {
    var zipcode = req.query['zipcode'];

    res.send(api.zipcodeLookup(zipcode));
});


// returns JSON data about the state and national average costs for a procedure
router.get('/averages', function(req, res, next) {
    var zipcode = req.query['zipcode'];
    var procedure = req.query['procedure'];

    api.averagePrices(procedure, zipcode)
        .then(function(data) {
            // success
            res.send(data);
        })
        .catch(function(error) {
            // error
            res.status(500)
                .send(error);
        });
});


module.exports = router;
