Parse.Cloud.define("importGames", function(request, response) {	
	
	var gamesJson = require('cloud/json/games.js');

	for(var i = 0; i < gamesJson.length; i++) {
		var Game = Parse.Object.extend("Game");
		var game = new Game();
	    var obj = gamesJson[i];
	    game.set(obj);
	    dataToImport[i] = game;
	}

	Parse.Object.saveAll(dataToImport,{
	    	success: function(list) {
	      	// All the objects were saved.
	      	response.success("All Imported"); 
    	},
	    	error: function(error) {
	      	// An error occurred while saving one of the objects.
	      	response.error("Error");
    	},
  	});
});

Parse.Cloud.define("importSampleGameData", function(request, response) {	

	var gameDataJson = require('cloud/json/gamedata.js');
	
	for(var i = 0; i < gameDataJson.length; i++) {
		var GameData = Parse.Object.extend("GameData");
		var gameData = new GameData();
	    var obj = gameDataJson[i];
	    gameData.set(obj);
	    dataToImport[i] = gameData;
	}

	Parse.Object.saveAll(dataToImport,{
	    	success: function(list) {
	      	// All the objects were saved.
	      	response.success("All Imported"); 
    	},
	    	error: function(error) {
	      	// An error occurred while saving one of the objects.
	      	response.error("Error");
    	},
  	});
});

Parse.Cloud.define("importTwitterHandles", function(request, response) {	

	var twitterData = require('cloud/json/twitter.js');
	
	for(var i = 0; i < twitterData.length; i++) {
		var Twitter = Parse.Object.extend("Twitter");
		var twitter = new Twitter();
	    var obj = twitterData[i];
	    twitter.set(obj);
	    dataToImport[i] = twitter;
	}

	Parse.Object.saveAll(dataToImport,{
	    	success: function(list) {
	      	// All the objects were saved.
	      	response.success("All Imported"); 
    	},
	    	error: function(error) {
	      	// An error occurred while saving one of the objects.
	      	response.error("Error");
    	}
  	});
});