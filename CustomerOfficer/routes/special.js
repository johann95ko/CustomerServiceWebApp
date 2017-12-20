var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('special', { title: 'Speciail Accomodation Protocols' });
});

module.exports = router;