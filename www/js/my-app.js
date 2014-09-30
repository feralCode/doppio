// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
  // Because we use fixed-through navbar we can enable dynamic navbar
  dynamicNavbar: true
});

var message_cache = [];
/*
var setCerdentials = function(sessionObj) {
  // set document cookie from the passed session for future requests
  var domain = document.domain;
  var cookie = 'feralUser=' + sessionObj.token + '; ' + domain;
  if (window.location.protocol === 'https:') {
    cookie += '; Secure';
  }
  document.cookie = cookie;
};
*/
function generator() {
  // Add your own words to the wordlist. Be carefull to obey the showed syntax

  var wordlist1 = ["Cool","Masked","Bloody","Lame","Big","Stupid","Drunk","Rotten",
        "Blue","Black","White","Red","Purple","Golden","Silver","Sexy","Slick",
        "Trappin","Gucci","Flocka", "Trill", "Fashion", "Magic", "Guessin"];

  var wordlist2 = ["Hamster","Moose","Lama","Duck","Bear","Eagle","Tiger",
        "Rocket","Bullet","Knee","Foot","Hand","Mistress","Geisha","Flame",
        "Squad", "Bish", "jong un"];

  // Random numbers are made 
  var randomNumber1 = parseInt(Math.random() * wordlist1.length);
  var randomNumber2 = parseInt(Math.random() * wordlist2.length);
  var name = wordlist1[randomNumber1] + " " + wordlist2[randomNumber2];     

  return name;
}  

//////////////////////////////////////////////////////////////////////////////
//messages.html helpers
///////////////////////////////////////////////////////////////////////////////
function messengerHelper(context) {
  //return if no attachments found
  if (!context || context.length < 1) {
    return '';
  }
  //html string to be returned
  var htmlRt = '';
  //used to measure time in between messages
  var lastMsgDate  = 0;
  var todaysDate   = moment().hour(0).minute(0).valueOf();
  var yesterDate   = moment().day(-1).hour(0).minute(0).valueOf();
  var lastUser     = '';
  //sort messages by date for processing
  var sortedByTime = _.sortBy(context, function(msg) {
    //might be faster way? maybe on ajax
    return msg.date;
  });

  //lets get a count of all the stat status'
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
          moment(v.date).format('h:mm A') +
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
  $$(".page-content.messages-content .messages").html(htmlRt);
  myApp.updateMessagesAngles($$(".messages"));
}

var updater = {
    socket: null,

    start: function() {
        var url = "ws://" + location.host + "/atlanta" ;
        updater.socket = new WebSocket(url);
        updater.socket.onmessage = function(event) {
            updater.showMessage(JSON.parse(event.data));
        };
        updater.socket.onopen = function() {
            //set user name on server
            updater.socket.send(JSON.stringify({ name: generator() }));
        };
    },
    showMessage: function(message) {
        //var existing = $("#m" + message.id);
        if (message.length === 0) return;

        console.log('received message');
        console.log(message);

        if ('body' in  message) {
          message_cache.push(message);
          // Add Message
          myApp.addMessage({
              name: message.from_name,
              text: message.body,
              type: 'received',
              day: 'Today' || false,
              time: moment(message.date).format('h:mm A') || false
          });
        }

        if (message.length > 1) {
          _.each(message, function(v) {
            message_cache.push(v);
            messengerHelper(message_cache);
            /*myApp.addMessage({
              name: v.from_name,
              text: v.body,
              type: 'received',
              day: 'Today' || false,
              time: moment(message.date).format('h:mm A') || false
            });*/

          });//end of each
        }
    }
  };//end of updater

/* ===== Document load Actions ===== */
window.onload = function() {
  console.log('document load compelte');
  updater.start();

  var namePopup = $$('.name-popup');
  myApp.popup(namePopup);



  messengerHelper(message_cache);
  

  $$('.messagebar textarea').on('keyup', function (e) {
    console.log(e.keyCode);
    if (e.keyCode == 13) {
      $$('.messagebar a.link').trigger('click');
    }
  });

  $$('.messagebar a.link').on('click touchstart', function () {
    var room = 'atlanta';
    var textarea = $$('.messagebar textarea');
    var messageText = textarea.val();
    if (messageText.length === 0) return;
    var data = {
      body: messageText,
      room: room
    };
    updater.socket.send(JSON.stringify(data));
    // Empty textarea
    textarea.val('').trigger('change').focus();
  });

};
