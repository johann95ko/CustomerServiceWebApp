var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('complains', { title: 'Complain Protocols' });
});

module.exports = router;