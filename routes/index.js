var express = require('express');
var router = express.Router();
var DeviceModel = require('../models/device.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var UserDbTools =  require('../models/userDbTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var hour = 60*60*1000;
var test = false;


module.exports = function(app) {
  app.get('/red', checkLoginLimit);
  app.get('/', checkLogin);
  app.get('/', function (req, res) {
  	    var now = new Date().getTime();
	    var finalList = JsonFileTools.getJsonFromFile(path);
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
			user:req.session.user
		});
  });

  app.get('/update', checkLogin);
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
				user:req.session.user
			});
		});
  });

  app.get('/find', checkLogin);
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
  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
	req.session.user = null;
  	var name = req.flash('post_name').toString();
	var successMessae,errorMessae;
	console.log('Debug register get -> name:'+ name);

	if(name ==''){
		errorMessae = '';
		res.render('user/login', { title: 'Login',
			error: errorMessae
		});
	}else{
		var password = req.flash('post_password').toString();

		console.log('Debug register get -> password:'+ password);
		UserDbTools.findUserByName(name,function(err,user){
			if(err){
				errorMessae = err;
				res.render('user/login', { title: 'Login',
					error: errorMessae
				});
			}
			if(user == null ){
				//login fail
				errorMessae = 'The account is invalid';
				res.render('user/login', { title: 'Login',
					error: errorMessae
				});
			}else{
				//login success
				if(password == user.password){
					req.session.user = user;
					return res.redirect('/');
				}else{
					//login fail
					errorMessae = 'The password is invalid';
					res.render('user/login', { title: 'Login',
						error: errorMessae
					});
				}
			}
		});
	}
  });


  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	var post_name = req.body.account;
  	var	post_password = req.body.password;
  	console.log('Debug login post -> name:'+post_name);
	console.log('Debug login post -> password:'+post_password);
	req.flash('post_name', post_name);
	req.flash('post_password', post_password);
	return res.redirect('/login');
  });

  app.get('/register', checkNotLogin);
  app.get('/register', function (req, res) {
  	var name = req.flash('post_name').toString();
	var password = req.flash('post_password').toString();
	var email = req.flash('post_email').toString();
	var successMessae,errorMessae;
	var count = 0;
	var level = 1;
	console.log('Debug register get -> name:'+ name);
	console.log('Debug register get -> password:'+ password);
	console.log('Debug register get -> email:'+ email);
	if(name==''){
		//Redirect from login
		res.render('user/register', { title: 'Register',
			error: errorMessae
		});
	}else{
		//Register submit with post method
		var test = false;
		if(test == true){ //for debug to remove all users
			UserDbTools.removeAllUsers(function(err,result){
				if(err){
					console.log('removeAllUsers :'+err);
				}
				console.log('removeAllUsers : '+result);
			});
		}

		UserDbTools.findUserByName(name,function(err,user){
			if(err){
				errorMessae = err;
				res.render('user/register', { title: 'Register',
					error: errorMessae
				});
			}
			console.log('Debug register user -> name: '+user);
			if(user != null ){
				errorMessae = 'This account already exists!';
				res.render('user/register', { title: 'Register',
					error: errorMessae
				});
			}else{
				//save database
				if(name == 'admin'){
					level = 0;
				}
				UserDbTools.saveUser(name,password,email,level,function(err,result){
					if(err){
						errorMessae = 'Registration is failed!';
						res.render('user/register', { title: 'Register',
							error: errorMessae
						});
					}
					UserDbTools.findUserByName(name,function(err,user){
						if(user){
							req.session.user = user;
						}
						return res.redirect('/');
					});
				});
			}
		});
	}
  });

  app.post('/register', checkNotLogin);
  app.post('/register', function (req, res) {
		var post_name = req.body.register_account;

		var successMessae,errorMessae;
		var	post_password = req.body.register_password;
		var	post_email = req.body.register_email;
		console.log('Debug register post -> post_name:'+post_name);
		console.log('Debug register post -> post_password:'+post_password);
		console.log('Debug register post -> post_emai:'+post_email);
		req.flash('post_name', post_name);
		req.flash('post_password', post_password);
		req.flash('post_email', post_email);
		return res.redirect('/register');
  });

  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '');
    res.redirect('/login');
  });
};

function checkLogin(req, res, next) {
	console.log("checkLogin");
  if (!req.session.user) {
    req.flash('error', 'No Register!'); 
    res.redirect('/login');
  }else
  {
	  next();
  }
  
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', 'Have login!'); 
    res.redirect('back');//返回之前的页面
  }else
  {
	  next();
  }
  
}

function checkLoginLimit(req, res, next) {
  console.log("red checkLoginLimit");
  if (!req.session.user ) {
  	console.log("No Register!");
    req.flash('error', 'No Register!'); 
    res.redirect('/login');
  }else if (req.session.user.name !== "admin") {
  	console.log("NNo Right for red control!");
    req.flash('error', 'No Right for red control!'); 
    res.redirect('/login');
  }else
  {
	  next();
  }
  
}