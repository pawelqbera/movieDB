// jshint devel:true
(function(window) {

	'use strict';

	var MovieDB = function(){

		console.log('Welcome to MovieDB');

		var moviesBtn = document.getElementById("moviesBtn");
		var moviesList = document.getElementById("moviesList");
		var addMovieBtn = document.getElementById("addMovieBtn");
		var addMovieForm = document.getElementById("addMovieForm");
		var updateMovieBtn = document.getElementById("updateMovieBtn");
		var searchMovieInput = document.getElementById("searchMovieInput");

		moviesBtn.addEventListener("click", this.getMovies.bind(this), false);
		addMovieBtn.addEventListener("click", this.addMovie.bind(this), false);
		updateMovieBtn.addEventListener("click", this.updateMovie.bind(this), false);
		searchMovieInput.addEventListener("keyup", this.searchMovie.bind(this), false);

		this.movies = [];
		addMovieForm.reset();
	};

	MovieDB.prototype.getMovies = function() {
		var _this = this;
	    var http = new XMLHttpRequest();
	    var url = '/movies';
		//Loading Box - wstawić do osobnej funkcji
		var moviesList = document.getElementById("moviesList");
		var loadingBox = document.createElement('DIV');
		var html = '';
		html += '<h1 id="loadingBox" class="loadingBox">Ładuję filmy! Chwila...</h1>';
  		loadingBox.innerHTML = html.trim();
  		moviesList.appendChild(loadingBox);
	   	http.open("GET", url, true);
	   	//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Connection", "close");
	    http.onreadystatechange = function() { 
			if (this.readyState == 4) { // If the HTTP request has completed 
			    if (this.status == 200) { // If the HTTP response code is 200 (e.g. successful)
			      document.getElementById("loadingBox").innerHTML = '';
			      var response = this.responseText; // Retrieve the response text
			      return _this.showMovies(response);
				}
			}
	    };			    
	    http.send(null);
	};

	MovieDB.prototype.showMovies = function(response) {	
	  cleanMovies();
	  var text = JSON.parse(response);
	  var i = 0, 
	  	  l = text.length,
	  	  html = '';

	  for (;i < l;i++) {	  	
	  	this.movies.push(new MovieRow(i,text));
	  }
	};

	function MovieRow(i,text) {
		this.text = text[i];
		this._id = this.text._id;

		var moviesList = document.getElementById("moviesList");
		
		//tworzę kontener na html, który będzie dodawany przez innerHTML
		var tempMoviesList = document.createElement('DIV');

		var html = '';

	  	html += '<ul id="movieRow' + this._id +'">';
	  	html += 	'<li>' + this.text.title + '<span class="year">' + ' ' + this.text.year + '</span></li>';
	  	html += 	'<li><span>Plot: </span><i>' + this.text.plot + '</i></li>';
	  	html += 	'<li><span><b>Director: </b></span>' + this.text.director + '</li>';
	  	html += 	'<li><span><b>Genre: </b></span>' + this.text.genre + '</li>';
	  	html += 	'<li><span><b>Country: </b></span>' + this.text.country + '</li>';
	  	html += 	'<li><a id="removeMovieBtn' + this._id + '">Remove</span></a></li>';
	  	html += 	'<li><a class="removeMovieFromDbBtn" id="removeMovieFromDbBtn' + this._id + '">Remove from Database</span></a></li>';
	  	html += 	'<li><a id="editMovieBtn' + this._id + '">Edit</span></a></li>';
	  	html += 	'<li><a id="cancelEditMovieBtn' + this._id + '" class="hidden">Cancel</span></a></li>';	  	
	  	html += '</ul>';

	  	tempMoviesList.innerHTML = html.trim();

	  	//dzięki temu obejściu, html nie będzie się zastępował, a eventy będą działać na wszystkich instancjach 
	  	moviesList.appendChild(tempMoviesList);

	  	//remove event handler
		var removeBtn = document.getElementById('removeMovieBtn' + this._id);	
		removeBtn.addEventListener("click", this.removeMovie.bind(this), false);

		var removeFromDbBtn = document.getElementById('removeMovieFromDbBtn' + this._id);	
		removeFromDbBtn.addEventListener("click", this.removeMovieFromDb.bind(this), false);

		var editBtn = document.getElementById('editMovieBtn' + this._id);	
		editBtn.addEventListener("click", this.editMovie.bind(this), false);

		var cancelEditBtn = document.getElementById('cancelEditMovieBtn' + this._id);	
		cancelEditBtn.addEventListener("click", this.cancelEditMovie.bind(this), false);
	}

	MovieRow.prototype.removeMovie = function(e) {
		var element = document.getElementById('movieRow' + this._id);
		element.parentNode.removeChild(element);
	};

	MovieRow.prototype.removeMovieFromDb = function(e) {
		var element = document.getElementById('movieRow' + this._id);
		element.parentNode.removeChild(element);
		
	    var http = new XMLHttpRequest();
	    var url = '/delete';
	    var params = "id=" + this._id;
	    http.open("DELETE", url, true);
		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", params.length);
		http.setRequestHeader("Connection", "close");

	    http.onreadystatechange = function() { 
			if (this.readyState == 4) { // If the HTTP request has completed 
			    if (this.status == 200) { // If the HTTP response code is 200 (e.g. successful)
			      var response = this.responseText; // Retrieve the response text   
			      console.log(response);
				}
			}
	    }; 
	    http.send(params);
	};

	MovieRow.prototype.editMovie = function(e) {
		window.scrollTo(0, 0);
		document.getElementById('editMovieBtn' + this._id).className = "hidden";
		document.getElementById('cancelEditMovieBtn' + this._id).className = "";
		addMovieBtn.className = "hidden";
		updateMovieBtn.className = '';

		document.getElementById("formTitle").value = this.text.title;
		document.getElementById("formYear").value = this.text.year;
		document.getElementById("formPlot").value = this.text.plot;
		document.getElementById("formDirector").value = this.text.director;
		document.getElementById("formGenre").value = this.text.genre;
		document.getElementById("formCountry").value = this.text.country;
		document.getElementById("movieId").value = this.text._id;
	};

	MovieRow.prototype.cancelEditMovie = function(e) {
		document.getElementById('editMovieBtn' + this._id).className = "";
		document.getElementById('cancelEditMovieBtn' + this._id).className = "hidden";
		addMovieBtn.className = "";
		updateMovieBtn.className = 'hidden';
		addMovieForm.reset();
	};		

	function cleanMovies() {
		moviesList.innerHTML = '';
	}	

	// Build movie class 
	var Movie = function() {
	 	this.title = document.getElementById("formTitle").value;
	 	this.year = document.getElementById("formYear").value;
	 	this.plot = document.getElementById("formPlot").value;
	 	this.director = document.getElementById("formDirector").value;
	 	this.genre = document.getElementById("formGenre").value;
	 	this.country = document.getElementById("formCountry").value;
	 	this.id = document.getElementById("movieId").value;
	 };

	MovieDB.prototype.addMovie = function(e) {
 	  	e.preventDefault();
 		//validation
 		if(this.validateMovieForm() === false) {
			return false;
 		}		
 		// instantiate new movie object
 		var movie = new Movie();	
 		var http = new XMLHttpRequest();
 		var url = "/add";
 		var params = "title=" + movie.title + "&year=" + movie.year + "&plot=" + movie.plot + "&director=" + movie.director + "&genre=" + movie.genre + "&country=" + movie.country;
 		http.open("POST", url, true);

 		//Send the proper header information along with the request
 		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
 		http.setRequestHeader("Content-length", params.length);
 		http.setRequestHeader("Connection", "close");

 		http.onreadystatechange = function() {//Call a function when the state changes.
 		    if(http.readyState == 4 && http.status == 200) {
 		        console.log(http.responseText);
 		        addMovieForm.reset();
 		    }
 		};
 		http.send(params);
	};

	MovieDB.prototype.updateMovie = function(e) {
	  	e.preventDefault();
		//validation
		if(this.validateMovieForm() === false) {
			return false;
		}
		var _this = this;
		var movie = new Movie();
		var http = new XMLHttpRequest();
		var url = "/update";
		var params = "id=" + movie.id + "&title=" + movie.title + "&year=" + movie.year + "&plot=" + movie.plot + "&director=" + movie.director + "&genre=" + movie.genre + "&country=" + movie.country;
		http.open("PUT", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", params.length);
		http.setRequestHeader("Connection", "close");

		http.onreadystatechange = function() {//Call a function when the state changes.
		    if(http.readyState == 4 && http.status == 200) {
				var response = this.responseText; // Retrieve the response text
				addMovieForm.reset();
				return _this.getMovies();	      	  
		    }
		};
		http.send(params);
	};

	MovieDB.prototype.validateMovieForm = function() {		
		var fields = ["title","year","plot","director","genre","country"],
			form  = document.getElementsByTagName('form')[0],
			i = 0,
			l = fields.length,
			fieldname = '';
		for (;i<l;i++) {
			fieldname = fields[i];
			if (form[fieldname].value === '') {
				console.log(fieldname + " is required!");
				return false;
			}
		}
	};

	MovieDB.prototype.searchMovie = function() {
		if (searchMovieInput.value === '') {
			return false;
		}
		var _this = this;
	    var http = new XMLHttpRequest();
	    var searchQuery = searchMovieInput.value;
	    var params = "search=" + searchQuery;
	    var url = '/search';

		//Loading Box - wstawić do osobnej funkcji
		var moviesList = document.getElementById("moviesList");
		var loadingBox = document.createElement('DIV');
		var html = '';
		html += '<h1 id="loadingBox" class="loadingBox">Czekaj! Szukam...</h1>';
  		loadingBox.innerHTML = html.trim();
  		moviesList.appendChild(loadingBox);
	   	// Handling Request
	   	http.open("POST", url, true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", params.length);
		http.setRequestHeader("Connection", "close");
	    http.onreadystatechange = function() { 
			if (this.readyState == 4) { // If the HTTP request has completed 
			    if (this.status == 200) { // If the HTTP response code is 200 (e.g. successful)
			      document.getElementById("loadingBox").innerHTML = '';
			      var response = this.responseText; // Retrieve the response text
			      console.log('Response z serwera: ' + response);
			      return _this.showMovies(response);
				}
			}
	    };			    
	    http.send(params);		
	};

	var init = new MovieDB();
	window.MovieDB = MovieDB;

})(window);