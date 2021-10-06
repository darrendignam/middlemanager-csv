var express = require('express');
var router = express.Router();

var async = require('async-waterfall');

var mm = require('../utility/mm-wrapper');
var idLookup = require('../utility/mm-id-lookup');
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
	// 	page_title: "middlemanager CSV",
	// 	page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
	// 	page_path: req.path,
	// 	page_type: "website",
	// });
});

/* Test the ability of the code to process an image into a base64 string. */
router.get('/base64test', function(req, res, next) {
	mm.encodeBase64_URI('https://upload.wikimedia.org/wikipedia/commons/a/a4/Isometric_Pixel_Art_by_Peterson_Freitas_%28enlarged%29.gif', (err, result)=>{
		if(err){
			res.json(err);
		}else{
			res.send('<img src="'+ result.data +'" alt="base64 img" />');
		}
	});
});


router.get('/test-id-lookup', function(req, res, next) {
	idLookup.getSiteData((err, data)=>{
		if(err){
			res.json(err);
		}else{
			let site_data = data;

			let _id = idLookup.returnSiteId("Twenty4 Container Hire", site_data)

			res.json({"data":data, " id":_id});
		}
	});
});


module.exports = router;
