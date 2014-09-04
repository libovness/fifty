
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
  
require('cloud/app.js');
var jquery = require('cloud/jquery-2.1.1.min.js');
var oauth = require('cloud/oauth.js');
var sha = require('cloud/sha1.js');
  
  
function getTeamByPlaceShort(placeShort) {
    var team = Parse.Object.extend("Team");
    var query = new Parse.Query(team);
    query.equalTo("placeShort",placeShort);
    team.resolve(query.first());
} 

var theCurrTeam;
var maxTweetId;

function getCurrTeam() {
    var lastTwitterPollQuery = new Parse.Query("LastTwitterPoll");
    lastTwitterPollQuery.ascending('updatedAt');
    lastTwitterPollQuery.first().then(function(result) {
        console.log(JSON.stringify(result));
        maxTweetId = result.tweetId;
        var currTeam = result.get('team');
        var objectId = JSON.stringify(currTeam).substring(13,23);
        var teamQuery = new Parse.Query("Team");
        theCurrTeam = teamQuery.get(objectId);
        console.log(theCurrTeam);
        return theCurrTeam;
    }), function() {
        console.log(error);
    };
};

function getTweets(currTeam) {   
    var currTeam = theCurrTeam;
    console.log('the currteam is ' + JSON.stringify(currTeam));

    if (!maxTweetId) {
        var urlLink = 'https://api.twitter.com/1.1/lists/statuses.json?slug=' + currTeam.nickname + '&owner_screen_name=FiftyApp';
    } else {
        var urlLink = 'https://api.twitter.com/1.1/lists/statuses.json?slug=' + currTeam.nickname + '&owner_screen_name=FiftyApp&since_id=' + maxTweetId;
    }

    var consumerSecret = "ne0zanSI5IiKg9DNFKvqRO0F7BJfvjMUEWV05qOJU2scYUsbCc";
    var tokenSecret = "PJGcgRga4bbeeZ6dfoUO1q5IhrgsnQJvyBu5gcFUzxOLR";
    var oauth_consumer_key = "RhvIw0lN08aTXdzfHxSTnmMW5";
    var oauth_token = "17611064-ndOOXimcEyq9RtylywbTqTeAs1jc4pUnf3cP0QPzM";
  
    var nonce = oauth.nonce(32);
    var ts = Math.floor(new Date().getTime() / 1000);
    var timestamp = ts.toString();
  
    var accessor = {
        "consumerSecret": consumerSecret,
        "tokenSecret": tokenSecret
    };
  
    var params = {
        "oauth_consumer_key": oauth_consumer_key,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": timestamp,
        "oauth_version": "1.0",
        "oauth_token": oauth_token
    };
  
    var message = {
        "method": "GET",
        "action": urlLink,
        "parameters": params
    };
  
    //lets create signature
    oauth.SignatureMethod.sign(message, accessor);
    var normPar = oauth.SignatureMethod.normalizeParameters(message.parameters);
    /* console.log("Normalized Parameters: " + normPar); */
    var baseString = oauth.SignatureMethod.getBaseString(message);
    /* console.log("BaseString: " + baseString);  */
    var sig = oauth.getParameter(message.parameters, "oauth_signature") + "=";
    /* console.log("Non-Encode Signature: " + sig);  */
    var encodedSig = oauth.percentEncode(sig); //finally you got oauth signature
    /* console.log("Encoded Signature: " + encodedSig); */

    return Parse.Cloud.httpRequest({
        method: 'GET',
        url: urlLink,
        headers: {
            "Authorization": 'OAuth oauth_consumer_key="RhvIw0lN08aTXdzfHxSTnmMW5", oauth_nonce="' + nonce + '", oauth_signature="' + encodedSig + '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + timestamp + '",oauth_token="17611064-ndOOXimcEyq9RtylywbTqTeAs1jc4pUnf3cP0QPzM", oauth_version="1.0"'
        },
        body: {
        }, success: function(httpResponse) {
            console.log('tweets pulled for ' + currTeam.get('nickname'));
        }, error: function(httpResponse) {
            console.log('tweets failed to pull!');
        }
    });

};


function saveTweets(tweets) {
    console.log('hello ' + currTeam.get('nickname'));
    var TweetClass = Parse.Object.extend("Tweet");
    var firstParsedTweet = tweets[0];
    var mostRecentTweetId = firstParsedTweet.id_str;
    var tweetArray = [];
    var lastTwitterPollQuery = new Parse.Query("LastTwitterPoll");
    lastTwitterPollQuery.equalTo("team", currTeam);
    lastTwitterPollQuery.first({
        success: function(poll) {
            if(!poll) {
                var newTwitterPoll = Parse.Object.extend("LastTwitterPoll");
                var newTWitterPollObj = new newTwitterPoll();
                newTWitterPollObj.set('lastTweetId',mostRecentTweetId);
                newTWitterPollObj.set('team',currTeam);
                newTWitterPollObj.save();
            } else {
                console.log('poll is ' + JSON.stringify(poll));
                poll.set("lastTweetId", mostRecentTweetId);
                poll.save();
            }
        },
        error: function(poll) {
            //
        }
    });
    
    
    for (i = 0; i < tweets.length; i++) {
        var tweetSet = new TweetClass();
        var tweet = tweets[i];
        if (tweet['entities']['media'] != null) {
            var media = tweet['entities']['media'];
            var media_url = media[0]['media_url']
            tweetSet.set("tweetImageURL",media_url);
        };
        tweetSet.set("text",tweet.text);
        tweetSet.set("tweetId",tweet.id_str);
        tweetSet.set("team",currTeam);
        tweetSet.set("userImageURL",tweet['user']['profile_image_url']);
        tweetSet.set("userId",tweet['user']['id']);    
        tweetSet.set("userName",tweet['user']['name']);
        var cleanedDate = new Date(Date.parse(tweet['created_at'].replace(/( +)/, ' UTC$1')));
        tweetSet.set("tweetCreatedAt",cleanedDate);                    
        tweetArray.push(tweetSet);
    }

    return Parse.Object.saveAll(tweetArray, {
        success: function (results) {
            results;
        },
        error: function (error) {
            error;
        }
    });
};
   

Parse.Cloud.job("updateAllTwitters", function(request, status) {
    getCurrTeam();
    /*.then(function(result) {
        return result;
    }).then(function(result) {
        return getTweets();
    }).then(function(tweets) {
        var tweetText = tweets.text;
        var parsedTweets = JSON.parse(tweetText);
        return saveTweets(parsedTweets);
    }).then(function() {
        status.success("All good!");
    }, function(error) {
        status.error("No good!")
    }); */
});

    

