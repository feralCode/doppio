#test python tornado script

from datetime import date
import logging
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path
import uuid

from tornado.options import define, options, parse_command_line

define("port", default=8001, help="run on the given port", type=int)
define("debug", default=False, help="run in debug mode")

class MessageBuffer():
  waiters = set()
  cache = []
  cache_size = 200

#create cache for all rooms
__terminus_message_buffer__ = MessageBuffer()
__trill_message_buffer__    = MessageBuffer()
__random_message_buffer__   = MessageBuffer()
__alt_message_buffer__      = MessageBuffer()

# class BaseHandler(tornado.websocket.WebSocketHandler):
#   #lets allow cross origin by default
#   #def set_default_headers(self):
#     #self.set_header("Access-Control-Allow-Origin", "*")

#   #check set room prop if avaiable
#   def room_buffer(self, message):
#     room_list = ['terminus', 'trill', 'random', 'alt']
#     room = self.request.uri.split('chat/')
#     room = room[1]
#     logging.info("room in query param %s", room)
#     if not room: 
#       return None
#     elif room in room_list:
#       #since valid room return approp buffer
#       if room == 'terminus':
#         return __terminus_message_buffer__
#       if room == 'trill':
#         return __trill_message_buffer__
#       if room == 'random':
#         return __random_message_buffer__
#       if room == 'alt':
#         return __alt_message_buffer__
#     else:
#       return None

#   def get_location(self):
#     gps_string = self.get_argument("gps_string", strip=True)
#     if not gps_string: return None
#     location = gps_string.split(',')
#     return tornado.escape.to_unicode(location)

#   def get_current_user(self):
#     user_json = self.get_cookie("feralUser") #feralUser {name}
#     if not user_json:
#       #user is anon by default
#       r = {"name": 'anonymous'}
#     else :
#       r = tornado.escape.json_decode(user_json)
#     return r


class ChatHandler(tornado.websocket.WebSocketHandler):
  waiters = set()
  cache = []
  cache_size = 200

  def open(self):
    logging.info("on websocket open")
    ChatHandler.waiters.add(self)

  def on_close(self):
    logging.info("on websocket closed")
    ChatHandler.waiters.remove(self)

  @classmethod
  def update_cache(cls, chat):
    cls.cache.append(chat)
    if len(cls.cache) > cls.cache_size:
      cls.cache = cls.cache[-cls.cache_size:]

  @classmethod
  def send_updates(cls, chat):
    logging.info("sending message to %d waiters", len(cls.waiters))
    for waiter in cls.waiters:
      try:
        waiter.write_message(chat)
      except:
        logging.error("Error sending message", exc_info=True)

  def on_message(self, message):
    logging.info("got message %r", message)
    parsed = tornado.escape.json_decode(message)
    chat = {
      "id": str(uuid.uuid4()),
      "from": parsed["name"],
      "body": parsed["body"],
      "room": parsed["room"],
      "date": date.today().isoformat()
      }
    ChatHandler.update_cache(chat)
    ChatHandler.send_updates(chat)

class VersionHandler(tornado.web.RequestHandler):
  def get(self):
    response = { 'version': '0.0.1' }
    self.write(response)

def main():
  parse_command_line()
  app = tornado.web.Application(
    [
      (r"/random", ChatHandler),
      (r"/trill", ChatHandler),
      (r"/version", VersionHandler),
      (r"/(.*)", tornado.web.StaticFileHandler, {"path": "www"})
    ],
    static_path=os.path.join(os.path.dirname(__file__), "www"),
    debug=options.debug,
    )
  app.listen(options.port)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()