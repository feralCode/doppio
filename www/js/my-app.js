// Initialize your app
var __MY_APP__ = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = __MY_APP__.addView('.view-main', {
  // Because we use fixed-through navbar we can enable dynamic navbar
  dynamicNavbar: true
});

var session = new __SESSION_VM__;

/* ===== Document load Actions ===== */
window.onload = function() {
  console.log('document load compelte');

  
  session.nameGen();//creat random name for user
  session.openRoom();//open atalnta room for chat

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
    session.sendMsg(messageText);
    // Empty textarea
    textarea.val('').trigger('change').focus();
  });

};
