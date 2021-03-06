Meteor.methods({
  addGame: function (gameHash) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Games.insert({
      player: Meteor.userId(),
      created: new Date(),
      hash: gameHash,
      score: "0",
      words:[]
    });
  },
  updateScore: function(hash, score){
    Games.update(
      {hash:hash, player:Meteor.userId()},
      {$set:{score:score}}
    );
  },
  checkGame: function(gameHash){
    return !!Games.find({player:Meteor.userId(), hash:gameHash}).count();
  },
  updateUsername: function(username){
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Accounts.setUsername(Meteor.userId(), username);
  },
  // checks a word exists, saves the users selection, and returns the word score
  // score = 0 for non-words
  checkWord: function(word, hash){
    var lowerWord = word.toLowerCase();
    var score = 0;
    if (!!Dictionary.find({word:lowerWord}).count()){
      score = getWordScore(word);
      Games.update(
        {hash:hash, player:Meteor.userId()},
        {$push:{words:{score:score, word:word}}}
      );
      return {word:word, score:score};
    }else{
      return {word:word, score:0};
    }
    return {word:word, score:score};
  },
  createChallenge: function(usersString){
    //usersString is the string the user wrote with usernames.
    var users = usersString.split(", ");
    var checkedUsers = [];
    var checkedUsernames = [];
    for(i=0;i<users.length;i++){
      //make sure usernames exist and are not duplicated.
      if((!!Meteor.users.find({username: users[i]}).count()) && checkedUsernames.indexOf(users[i]) == -1){
        var user_id =  Accounts.findUserByUsername(users[i])._id;
        checkedUsers.push({username: users[i], user_id: user_id,  played:false});
      }
      checkedUsernames.push(users[i]);
    }
    //make sure the user creating the challenge is included.
    if(checkedUsernames.indexOf(Meteor.user().username) == -1){
      var user_id = Meteor.user()._id;
      checkedUsers.push({username: Meteor.user().username, user_id: user_id, played:false});
    }
    //get a game hash for the challenge.
    var game = getGameHash(getGame());
    //insert the challenge
    Challenges.insert({
      players: checkedUsers,
      hash: game
    });
  },
  completeChallenge: function(chal_id, score){
    var username = Meteor.user().username;
    Challenges.update(
      {_id:chal_id, "players.username":username},
      { $set: {"players.$.played":true, "players.$.score":score }}
    );
  },
  getUserGame: function(user, hash){
    return Games.findOne({hash:hash, player:user}).words;
  },
  defineWord : function(word) {
    res = Meteor.http.call("GET", "http://api.wordnik.com/v4/word.json/" + word + "/definitions?limit=1&useCanonical=true&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5")
    return(res.data[0].partOfSpeech + " -- " + res.data[0].text)
  }
});
