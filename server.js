(function(){
	
	/**
	 * Main application file
	 */

	'use strict';

	var express = require('express');
	var mongoose = require('mongoose');
	mongoose.connect('mongodb://pawelq:Cjt3kUGXgPRczbQo@ds041623.mongolab.com:41623/movies');

	// Connect to database
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	  console.log('Connected to movies database on mongolab!');
	});

	// Setup server
	var app = express();
	var server = require('http').createServer(app);

	// Start server
	server.listen(7000, 'localhost', function () {
	  console.log('Express server listening on %d, in %s mode', 7000, 'localhost');
	});

	app.use(express.static(__dirname + '/'));
	app.use(express.static(__dirname + '/app'));
	app.use(express.static(__dirname + '/.tmp'));

	app.get('/',function(req,res){
	  res.sendFile('index.html');
	});

	var Schema = mongoose.Schema;
	var movies = mongoose.model('Movies', new Schema({ 
		title: String,
		year: Number,
		plot: String,
		director: String,
		genre: String,
		country: String
	}), 'Movies');

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

})();