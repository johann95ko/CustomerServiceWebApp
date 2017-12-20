var express = require('express');
var router = express.Router();

//console.log(JSON.stringify(keywords, null, 2))

/* GET home page. */
router.get('/', function(req, res, next) {
    var suggestedUrl = require('./index.js').suggestedUrl;
    var estimatedTime = require('./index.js').ewt;
    console.log(estimatedTime);
    res.render('successfulForm', { title: 'Success', url: suggestedUrl, time: estimatedTime});
});

module.exports = router;
