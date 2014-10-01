/////////////////////////////////////////////////////////////
//    SESSION VM
/////////////////////////////////////////////////////////////
window.__SESSION_VM__ = function() {
  //return as class if called as function
  if(!(this instanceof __SESSION_VM__)) {
    return new __SESSION_VM__();
  }
  this.connected = false;

  //user name for session
  var _NAME = false;
  //active message VM
  var _MSG_VM = false;
  //private variables
  _WEB_SOCKET = false;
  var _ROOM_NAME = 'atlanta';

  this.nameGen = function() {
    // Add your own words to the wordlist. Be carefull to obey the showed syntax

    var wordlist1 = ["Cool","Masked","Bloody","Lame","Big","Stupid","Drunk","Rotten",
          "Blue","Black","White","Red","Purple","Golden","Silver","Sexy","Slick",
          "Trappin","Gucci","Flocka", "Trill", "Fashion", "Magic", "Guessin"];

    var wordlist2 = ["Hamster","Moose","Llama","Duck","Bear","Eagle","Tiger",
          "Rocket","Bullet","Knee","Foot","Hand","Mistress","Geisha","Flame",
          "Squad", "Bish", "jong un"];

    // Random numbers are made 
    var randomNumber1 = parseInt(Math.random() * wordlist1.length);
    var randomNumber2 = parseInt(Math.random() * wordlist2.length);
    _NAME = wordlist1[randomNumber1] + " " + wordlist2[randomNumber2];
  }

  
  
  //open session for room
  this.openRoom = function() { //set default if no room passed
    var url = "ws://" + location.host + "/" + _ROOM_NAME;
    _WEB_SOCKET = new WebSocket(url);
    _MSG_VM = new __MESSAGE_VM__;


    _WEB_SOCKET.onopen = function(event) {
      console.log('on open command run');
      //set user name on server
      _WEB_SOCKET.send(JSON.stringify({ name: _NAME }));
      this.connected = true;
    }

    //websocket onmessage handler
    _WEB_SOCKET.onmessage = function(event) {
      console.log('on message command run');
      _MSG_VM.onEvent(JSON.parse(event.data));
    }

    _WEB_SOCKET.onclose = function(event) {
      console.log('Connection Closed');
      this.connected = false;
      //retryging needed here
    }

  }

  //send message on message bus
  this.sendMsg = function(message) {
    var data = {
      body: message,
      room: _ROOM_NAME
    };
    _WEB_SOCKET.send(JSON.stringify(data));
  }

  /*bouns of app area of use for future use
    top -84.358980, bottom -84.364707
    left 33.767124, right 33.713166
  */
}
/////////////////////////////////////////////////////////////
//    MESSAGE VM
/////////////////////////////////////////////////////////////
window.__MESSAGE_VM__ = function() {
  //return as class if called as function
  if(!(this instanceof __MESSAGE_VM__)) {
    return new __MESSAGE_VM__();
  }

  //private prop
  var _MESSAGE_CACHE = [];
  var _LURKERS = [];
  var _LAST_USER = false;
  
  //event handler for messages
  this.onEvent = function(e) {
    if (e.length === 0) return;
    console.log('received message');
    console.log(e);
    if ('body' in  e) {
      msgUpdate(e);
    }
    if ('lurker_count' in e){
      lurkerUpdate(e);
    }
    if (e.length > 1) {
      msgInit(e);
    }
  }

  var msgInit = function(messages) {
    if (messages.length < 1) {
      return;
    }
    //html string to be returned
    var htmlRt = '';
    //used to measure time in between messages
    var lastMsgDate  = 0;
    var todaysDate   = moment().zone(4).hour(0).minute(0).valueOf();
    var yesterDate   = moment().zone(4).day(-1).hour(0).minute(0).valueOf();
    var lastUser     = '';
    //sort messages by date for processing
    var sortedByTime = _.sortBy(messages, function(v) {
      //might be faster way? maybe on ajax
      return v.date;
    });
    //lets calculate post time and post appropriate date string
    _.each(sortedByTime,function(v){
      var stampStr = '';
      
      console.log('message content ' + v.body);

      if(v.date > todaysDate){
        stampStr = 'Today ';
      }
      else if (v.date > yesterDate){
        stampStr = 'Yesterday ';
      }
      else {
        stampStr = moment(v.date).format('dddd');
      }
      //if there is one minute difference between messages 
      //print time stamp
      if(moment(v.date).diff(moment(lastMsgDate)) > 60000) {
        htmlRt += '<div class="messages-date">' +
          stampStr + ' ' +
          '<span>' +
            moment(v.date).zone(-4).format('h:mm A') +
          '</span>' +
        '</div>';
      }

      htmlRt += '<div class="message message-received">' +
        '<div class="message-name">' + v.from_name + '</div>' +
        '<div class="message-text">' +
          v.body +
        '</div>' +
      '</div>';

      //set time to last message timestamp
      lastMsgDate = v.date;
      //set last user to last userid see
      lastUser    = v.from_id;
    });
    //push messages to dom
    $$(".page-content.messages-content .messages").html(htmlRt);
    
    
    //set last user
    _LAST_USER = lastUser;
    //push all messages to cache
    _MESSAGE_CACHE = messages;

    //scroll to last message
    var msg_cont = $$('.messages');
    var msg_content = $$('.messages-content')
    __MY_APP__.updateMessagesAngles(msg_cont);
     __MY_APP__.scrollMessagesContainer(msg_content);

    
  }

  var msgUpdate = function(message) {
    //if same user posting don't post time
    var day = false;
    var time = false;
    var name = false;
    console.log('_LAST_USER - ' + _LAST_USER + ' new message id - ' +  message.from_id);
    if(_LAST_USER != message.from_id) {
      day = 'Today';
      time = moment(message.date).zone(-4).format('h:mm A') || false;
      name = message.from_name;
      //set last user to current user_id
      _LAST_USER = message.from_id;
    }
    // Add Message to view
    __MY_APP__.addMessage({
        name: name,
        text: message.body,
        type: 'received',
        day:  day,
        time: time
    });
    //push message to cache
    _MESSAGE_CACHE.push(message);
  }

  var lurkerUpdate = function(lurkers) {
    //get count of current users in room
    _LURKERS = lurkers.lurker_count;
    var html_string = _LURKERS + ' watchers';
    if(_LURKERS == 1 ){
      html_string = 'forever alone' ;
    }

    $$('#luker_count').text(html_string);
  }


}