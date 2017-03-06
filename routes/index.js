var express = require('express');
var router = express.Router();
var DeviceModel = require('../models/device.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var hour = 60*60*1000;
var test = false;


module.exports = function(app) {
  app.get('/', function (req, res) {
  	    var now = new Date().getTime();
	    var finalList = JsonFileTools.getJsonFromFile(path);
		var testObj = JsonFileTools.getJsonFromFile(path2);
		test = testObj.test;
		var keys = Object.keys(finalList);
		for(var i=0;i<keys.length ;i++){
			console.log(i+' timestamp : '+ finalList[keys[i]].timestamp);
			console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
			//finalList[keys[i]].overtime = false;
			if( ((now - finalList[keys[i]].timestamp)/hour) > 6 )  {
				finalList[keys[i]].overtime = false;
			}
		}
		res.render('index', { title: '首頁',
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			finalList:finalList,
			test:test
		});
  });

  app.get('/update', function (req, res) {
	    var testObj = JsonFileTools.getJsonFromFile(path2);
		test = testObj.test;
		DeviceModel.findOne({}, {}, { sort: { 'created_at' : -1 } }, function(err, device) {
			//console.log( "last record : "+device );
			console.log( "Find last record" );
			
			res.render('update', { title: '更新',
				device: device,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				test:test
			});
		});
  });

  app.get('/find', function (req, res) {
	var testObj = JsonFileTools.getJsonFromFile(path2);
	test = testObj.test;
	console.log('render to post.ejs');
	var find_mac = req.flash('mac').toString();
	var successMessae,errorMessae;
	var count = 0;
	console.log('mac:'+find_mac);

	if(find_mac.length>0){
		console.log('find_mac.length>0');
		DeviceModel.find({ macAddr: find_mac }, function(err,devices){
			if(err){
				console.log('find name:'+find_mac);
				req.flash('error', err);
				return res.redirect('/find');
			}
			console.log("find all of mac "+find_mac+" : "+devices);
			devices.forEach(function(device) {

				console.log('mac:'+device.macAddr + ', data :' +device.data);
				count = count +1;
			});

			if (devices.length>0) {
				console.log('find '+devices.length+' records');
				successMessae = '找到'+devices.length+'筆資料';
				res.render('find', { title: '查詢',
					devices: devices,
					success: successMessae,
					error: errorMessae,
					test:test
				});
			}else{
				console.log('找不到資料!');
				errorMessae = '找不到資料!';
				req.flash('error', err);
      			return res.redirect('/find');
	  		}

    	});
	}else{
		console.log('find_name.length=0');
		res.render('find', { title: '查詢',
			devices: null,
			success: successMessae,
			error: errorMessae,
			test:test
	  });
	}


  });
  app.post('/find', function (req, res) {
	var	 post_mac = req.body.mac;

	console.log('find mac:'+post_mac);
	req.flash('mac', post_mac);
	return res.redirect('/find');
  });
};