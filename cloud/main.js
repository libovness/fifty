// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
  
require('cloud/app.js');
var jquery = require('cloud/jquery-2.1.1.min.js');
var oauth = require('cloud/oauth.js');
var sha = require('cloud/sha1.js');
  
  
function getTeam(placeShort) {
    var team = Parse.Object.extend("Team");
    var query = new Parse.Query(team);
    query.equalTo("placeShort",placeShort);
    return query.first();
} 
 
function getLastTweet(team) {
    var lastTwitterPoll = Parse.Object.extend("LastTwitterPoll");
    var lastTwitterPollQuery = new Parse.Query(lastTwitterPoll);
    lastTwitterPollQuery.equalTo("team",team);    
    lastTwitterPollQuery.first().then(function(lastTweet) {
    if (!lastTweet) {
            //
        } else {
            return lastTweet.get('lastTweetId');
        }
    }).then(function(error) {
        return error;
    });
};
  
function getTweets(team) {
    var maxTweetId = getLastTweet(team);
    if (!maxTweetId) {
        var urlLink = 'https://api.twitter.com/1.1/lists/statuses.json?slug=' + team.get('nickname') + '&owner_screen_name=FiftyApp';
    } else {
        var urlLink = 'https://api.twitter.com/1.1/lists/statuses.json?slug=' + team.get('nickname')  + '&owner_screen_name=FiftyApp&since_id=' + maxTweetId;
    }
    console.log('the url link is ' + urlLink)
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
    /* console.log("Encoded Signature: " + encodedSig);  */
 
    Parse.Cloud.httpRequest({
        method: 'GET',
        url: urlLink,
        headers: {
            "Authorization": 'OAuth oauth_consumer_key="RhvIw0lN08aTXdzfHxSTnmMW5", oauth_nonce="' + nonce + '", oauth_signature="' + encodedSig + '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + timestamp + '",oauth_token="17611064-ndOOXimcEyq9RtylywbTqTeAs1jc4pUnf3cP0QPzM", oauth_version="1.0"'
        },
        body: {
        }).then(function(httpResponse) {
            console.log("FML");
            console.log("response is " + httpResponse.text);
            return httpResponse.text;
        }, function(error) {
            return error;
        };
    }); 
  
function saveTweets(tweets) {
    var TweetClass = Parse.Object.extend("Tweet");
    var theTweetData = tweets;
    var mostRecentTweetId = theTweetData[0].id_str;
    var tweetArray = [];
 
    var lastTwitterPoll = Parse.Object.extend("LastTwitterPoll");
    var lastTwitterPollQuery = new Parse.Query(lastTwitterPoll);
    lastTwitterPollQuery.equalTo(team);
 
    lastTwitterPollQuery.first().then(function(lastPoll) {
        if(!lastPoll) {
            var twitterPoll = new lastTwitterPoll();
            twitterPoll.set("lastTweetId",mostRecentTweetId);
            twitterPoll.set("team",team);
            twitterPoll.save();
        } else {
            results.set("lastTweetId",mostRecentTweetId);
            results.save();
        }}).then(function(error) {
            return error;
    });
 
     
    for (i = 0; i < theTweetData.length; i++) {
        var tweetSet = new TweetClass();
        var tweet = theTweetData[i];
 
        if (tweet['entities']['media'] != null) {
            var media = tweet['entities']['media'];
            var media_url = media[0]['media_url']
            tweetSet.set("tweetImageURL",media_url);
        };
        tweetSet.set("text",tweet.text);
        tweetSet.set("tweetId",tweet.id_str);
        tweetSet.set("team",team);
        tweetSet.set("userImageURL",tweet['user']['profile_image_url']);
        tweetSet.set("userId",tweet['user']['id']);    
        tweetSet.set("userName",tweet['user']['name']);
        var cleanedDate = new Date(Date.parse(tweet['created_at'].replace(/( +)/, ' UTC$1')));
        tweetSet.set("tweetCreatedAt",cleanedDate);                    
        tweetArray.push(tweetSet);
    }
  
    Parse.Object.saveAll(tweetArray, {
        success: function (results) {
            response.success(results);
        },
        error: function (error) {
            response.error(error);
        }
    });
};
  
var currTeam;
 
Parse.Cloud.job("updateAllTwitters", function(request, status) {
  var team = Parse.Object.extend("Team");
  var query = new Parse.Query(team);
  query.first(function(theTeam) {
    return getTweets(theTeam);
    console.log(getTweets(theTeam));
  }/*).then(function(tweets) {
    saveTweets(tweets);
  }*/);
});