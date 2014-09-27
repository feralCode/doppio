// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
  // Because we use fixed-through navbar we can enable dynamic navbar
  dynamicNavbar: true
});

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

var room = '';
var updater = {
    socket: null,

    start: function(room) {
        var url = "ws://" + location.host + "/" + room;
        updater.socket = new WebSocket(url);
        updater.socket.onmessage = function(event) {
            updater.showMessage(JSON.parse(event.data));
        };
    },
    showMessage: function(message) {
        //var existing = $("#m" + message.id);
        //if (existing.length > 0) return;

        // Add Message
        myApp.addMessage({
            text: message.body,
            type: 'received',
            day: 'Today' || false,
            time: message.date || false
        });
    }
  };//end of updater

/* ===== Document load Actions ===== */
window.onload = function() {
  console.log('document load compelte');
  
  
};

$$(document).on('click', '.room-link', function() {
  room = $$(this).attr('data-room');
  updater.start(room); //start websocket listener
});
$$(document).on('click', '.back.link', function() {

  updater.socket.close(); //start websocket listener
});


/* ===== Messages Page ===== */
myApp.onPageInit('messages', function (page) {
  $$('.messagebar textarea').on('keyup', function (e) {
    console.log(e.keyCode);
    if (e.keyCode == 13) {
      $$('.messagebar a.link').trigger('click');
    }
  });

  $$('.messagebar a.link').on('click', function () {
    var textarea = $$('.messagebar textarea');
    var messageText = textarea.val();
    if (messageText.length === 0) return;
    var message = {
      body: messageText,
      room: room,
      name: 'anonymous'
    };
    updater.socket.send(JSON.stringify(message));
    // Empty textarea
    textarea.val('').trigger('change').focus();
  });

});
