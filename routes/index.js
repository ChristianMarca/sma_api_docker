var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({ title: 'Express',body:"Hola mundo" });
});

router.post('/uploadOperators', function(req, res, next) {
  console.log(req.body)
  res.status(200).json(res.body);
});


module.exports = router;
