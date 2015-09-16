(function(){	
	/**
	 * Main server.js file
	 */

	'use strict';

	// BASE SETUP
	// ==============================================

	// Set default node environment to development
	process.env.NODE_ENV = process.env.NODE_ENV || 'development';

	// Require statements
	var express = require('express');
	var mongoose = require('mongoose');
	var path = require('path');
	var bCrypt = require('bcrypt-nodejs');
	var session = require('express-session');
	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;
	var flash = require('connect-flash');
	var config = require('./config/environment/development');

	console.log("Config.env: " + process.env.NODE_ENV);

	var isDevelopment = (process.env.NODE_ENV === 'development') ? true : false;
	console.log('Is developemnt env?: ' + isDevelopment);

	// Setup server
	var app = express();
	app.set('port', (process.env.PORT || 7000));

	// Use flash
	app.use(flash());

	// ROUTES
	// ==============================================	

	if(isDevelopment) {
		app.use(express.static(__dirname + '/../'));
		app.use(express.static(__dirname + '/../.tmp'));
	} else {	
		app.use(express.static(__dirname + '/'));
	}
	
	console.log('Dirname is ' + __dirname);

	app.get('/', function(req,res){
	  res.sendFile(path.join(__dirname + '/index.html'));
	});	

	app.get('/login',function(req,res){
	  res.sendFile(path.join(__dirname + '/views/login.html'));
	});

	app.get('/contact',function(req,res){
	  res.sendFile(path.join(__dirname + '/views/contact.html'));
	});	

	app.get('/register',function(req,res){
	  res.sendFile(path.join(__dirname + '/views/register.html'));
	});

	// START THE SERVER
	// ==============================================
	
	// Start server the old way
	//	var server = require('http').createServer(app);
	//	server.listen(7000, 'localhost', function () {
	//	  console.log('Express server listening on %d, in %s mode', 7000, 'localhost');
	//	});
	
	app.listen(app.get('port'), function() {
	  console.log('Node app is running on port', app.get('port'));
	});

	// MONGODB CONNECTION
	// ==============================================	

	// Connect to database
	mongoose.connect(config.mongo.uri, config.mongo.options);
	
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	  console.log('Connected to movies database on mongolab!');
	});

	// Create movie data schema 
	var Schema = mongoose.Schema;
	var movies = mongoose.model('Movies', new Schema({ 
		title: String,
		year: Number,
		plot: String,
		director: String,
		genre: String,
		country: String
	}), 'Movies');

	// Create user data schema
	var user = new Schema({
	      id: String,
	      username: String,
	      email: String,
	      password: String
	    }, {
	      collection: 'userInfo'
	    });
	var User = mongoose.model('User', user);	

	// CRUD REST API
	// ==============================================

	var dbCount = '';

	var count = db.collection('Movies').count(function(err,docs){
		dbCount = docs;
	});

	app.get('/movies', function (req,res) {
		// dokończyć to żeby przekazywany był number wyświetlonych already wiadomosci
		var listedCount = dbCount;

		// find requsted data from database and send it to the client
		var moviesData = movies.find().skip(dbCount-listedCount).exec(function(err,data){
			res.json(data);
		});
		// To jest szukanie, które zwraca pierwsze 5 filmów
		//	var moviesData = movies.find({_id: {$gt: curId}}).sort({_id: 1 }).limit(5).exec(function(err,data){
		//		res.json(data);
		//	});	
	});

	//rzeczy potrzebne do prawidłowego przechwytywania postów
	// In order to accept data via POST or PUT, we need to add another package called body-parser.
	var bodyParser = require('body-parser');
		app.use( bodyParser.json() );       // to support JSON-encoded bodies
		app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  	extended: true
	}));

	app.post('/add', function (req,res) {

		console.log('Otrzymałem POST requesta:' + req.body);

		var movie = {
		  title: req.body.title,
		  year: req.body.year,
		  plot: req.body.plot,
		  director: req.body.director,
		  genre: req.body.genre,
		  country: req.body.country
		};

		db.collection('Movies').insert(movie, function(err,data){
			if (err) return handleError(err);
			res.send('Dodałem nowy film do bazy!' + data);
		});
	});

	app.delete('/delete', function (req,res) {
		console.log('Otrzymałem DELETE requesta:' + req.body.id);
		
		var reqid = req.body.id;

		movies.find({ _id: reqid}).remove(function(err,data){
			if (err) return handleError(err);
			res.send('Wyrzuciłem ten film z bazy!' + data);
		});

	});

	app.put('/update', function (req,res) {

		console.log('Otrzymałem PUT requesta:' + req.body.title);

		var reqid = req.body.id;

		var movie = {
		  title: req.body.title,
		  year: req.body.year,
		  plot: req.body.plot,
		  director: req.body.director,
		  genre: req.body.genre,
		  country: req.body.country
		};

		movies.findByIdAndUpdate(reqid, { $set: movie }, function(err,data){
			if (err) return handleError(err);
			res.send(data);
		});
	});

	app.post('/search', function (req,res) {
		var searchQuery = req.body.search;
		console.log('Szukam title zawierający:' + searchQuery);

		var moviesData = movies.find({"title" : {$regex : ".*" + searchQuery + ".*"}}).exec(function(err,data){
			res.json(data);
		});
	});

	function handleError(err) {
		console.log('Unable to finish the request. Error: ' + err);
	}

// LOGIN MODEL
// ==============================================

	// If enabled, be sure to use session() before passport.session() 
	// to ensure that the login session is restored in the correct order.
	app.use(session({
	    secret: 'mySecretKey',
	    resave: true,
	    saveUninitialized: true
	}));	
	app.use(passport.initialize());
	app.use(passport.session());

	// Handle Registration POST
	app.post('/register', 
		passport.authenticate('signup', {
			successRedirect: '/dashboard',
			failureRedirect: '/',
			failureFlash : true 
		})
	);

	// Handle Login POST
	app.post('/login',
	  passport.authenticate('local', {
	    successRedirect: '/dashboard',
	    failureRedirect: '/',
	    failureFlash : true
	  })
	);

	var isAuthenticated = function (req, res, next) {
		console.log('Odpalam funkcje sprawdzająca isAuthenticated... sprawdzam warunek:' + req.isAuthenticated());
		if (req.isAuthenticated()) {
			console.log("Yes indeed, is authenticated!");
			return next();		
		} else {
			console.log("Nooooottttt! User is currently unauthenticated... shame!");
	  		res.redirect('/login');
	  	}
	};

	// As with any middleware it is quintessential to call next()
	// if the user is authenticated

	app.get('/dashboard', isAuthenticated, function(req, res) {
	  res.sendFile(path.join(__dirname + '/views/dashboard.html'));
	});	

	// Serialize and deserialize the user instance	
	 passport.serializeUser(function(user, done) {
	 	done(null, user._id);
	 });

	 passport.deserializeUser(function(id, done) {
	 	User.findById(id, function(err, user) {
     		done(err, user);
   		});
	 });

/*	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
	  done(null, user);
	});*/

	// Always encrypt passwords before saving them to the database
	var isValidPassword = function(user, password){
		return bCrypt.compareSync(password, user.password);
	};

	// Generates hash using bCrypt
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};		

	// Define the local authentication strategy
	passport.use('local', new LocalStrategy({
			passReqToCallback : true
		},
		function(req, username, password, done) { 
		    // check in mongo if a user with username exists or not
			User.findOne({ 'username' :  username }, 
				function(err, user) {
					// In case of any error, return using the done method
					if (err)
						return done(err);
					// Username does not exist, log error & redirect back
					if (!user){
						console.log('User Not Found with username ' + username);
						return done(null, false,
						req.flash('message', 'User Not found.'));                 
					}
					// User exists but wrong password, log the error 
					if (!isValidPassword(user, password)){
						console.log('Invalid Password');
						return done(null, false,
						req.flash('message', 'Invalid Password'));
					}
					// User and password both match, return user from 
					// done method which will be treated like success
					console.log('Succeesssssssssssssssss!');
					return done(null, user);
				}
			);
		})
	);

	// Define the registration strategy
	passport.use('signup', new LocalStrategy({passReqToCallback : true},
		function(req, username, password, done) {
	    	var findOrCreateUser = function(){
	    		// find a user in Mongo with provided username
	    		User.findOne({'username' : username}, function(err, user) {
	        	// In case of any error return
			        if (err) {
			        	console.log('Error in SignUp: ' + err);
			        	return done(err);
			        }
			        // User already exists
			        if (user) {
			        	console.log('User already exists');
			        	return done(null, false, 
			        	req.flash('message','User Already Exists'));
			        } else {
			        	// If there is no user with that email create the user
			        	var newUser = new User();
			        	// Set the user's local credentials
			        	newUser.username = username;
			       		newUser.password = createHash(password);
			        	newUser.email = req.body.email;
			 
			        	// Save the user
			        	newUser.save(function(err) {
			            	if (err){
			            		console.log('Error in Saving user: ' + err);  
			           			throw err;  
			            	}
			            	console.log('User Registration succesful');
			            	return done(null, newUser);
		          		});
		        	}
	      		});
	    	};	     
		    // Delay the execution of findOrCreateUser and execute 
		    // the method in the next tick of the event loop
		    process.nextTick(findOrCreateUser);
	  }));

	// Handle Logout GET
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});

})();