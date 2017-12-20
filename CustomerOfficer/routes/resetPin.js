var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('resetPin', { title: 'Reset Pin Protocol' });
});

module.exports = router;