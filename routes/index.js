var express = require('express');
var router = express.Router();

var procedureSearch = require('../lib/procedure-search');

/* GET home page. */
router.get('/', function(req, res, next) {

    // procedureSearch("039 - EXTRACRANIAL PROCEDURES W/O CC/MCC", "36608", 100)
    //     .then(function(data){
    //         console.log(data);
    //     })
    //     .catch(function(error){
    //         console.error(error);
    //     });

    res.render('index', {
        title: 'My app'
    });
});

module.exports = router;
