var express = require('express');
var router = express.Router();

var async = require('async-waterfall');

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');
var _unitSizecode = require('../utility/unit-sizecode');

const json2csv = require('json2csv').parse;

const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const upload = multer({ dest: 'uploadedcsv/' });


/* GET home page. */
router.get('/', function(req, res, next) {
	res.send('CSV Portal');
	// res.render('index', {
	// 	page_title: "middlemanager demo site",
	// 	page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
	// 	page_path: req.path,
	// 	page_type: "website",
	// });
});


module.exports = router;
