var express = require('express');
var router = express.Router();

var procedureSearch = require('../lib/procedure-search');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

// Ajax
// Asynchronously fetch the list of similar procedures near the
// given zip codes. Returns a JSON array.
router.get('/procedures', function(req, res, next) {
    var zipcode = req.query['zipcode'];
    var procedure = req.query['procedure'];

    // get procedure data and return once it's good
    procedureSearch(procedure, zipcode, 25)
        .then(function(data) {
            // success
            res.send(data);
        })
        .catch(function(error) {
            // error
            res.status(500)
                .send(error);
        });
})

module.exports = router;
