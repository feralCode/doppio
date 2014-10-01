#test python tornado script

from time import gmtime, strftime
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

class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.set_header("Cache-control", "no-cache")
    self.render("www/index.html")

class ChatHandler(tornado.websocket.WebSocketHandler):
  waiters = set()
  message_cache = []
  whispers_cache = []
  cache_size = 200

  def open(self):
    logging.info("on websocket open")
    self.id = uuid.uuid4() #random id for user
    self.name = '';
    ChatHandler.waiters.add(self)
    self.write_message(tornado.escape.json_encode(ChatHandler.message_cache))
    ChatHandler.send_lurker_count()


  def on_close(self):
    logging.info("on websocket closed")
    ChatHandler.waiters.remove(self)
    ChatHandler.send_lurker_count()

  @classmethod
  def update_message_cache(cls, chat):
    cls.message_cache.append(chat)
    if len(cls.message_cache) > cls.cache_size:
      cls.message_cache = cls.message_cache[-cls.cache_size:]

  @classmethod
  def update_whisper_cache(cls, chat):
    cls.whispers_cache.append(chat)
    if len(cls.whispers_cache) > cls.cache_size:
      cls.whispers_cache = cls.whispers_cache[-cls.cache_size:]

  @classmethod
  def send_lurker_count(cls):
    logging.info("sending message to %d waiters", len(cls.waiters))
    #update users on current user count
    data = {
      "lurker_count" : len(cls.waiters)
    }
    for waiter in cls.waiters:
      try:
        waiter.write_message(data)
      except:
        logging.error("Error sending message", exc_info=True)

  @classmethod
  def send_updates(cls, chat):
    logging.info("sending message to %d waiters", len(cls.waiters))
    for waiter in cls.waiters:
      try:
        waiter.write_message(chat)
      except:
        logging.error("Error sending message", exc_info=True)

  @classmethod
  def send_whisper(cls, chat):
    logging.info("sending whisper to %s", chat['to_name'])
    for waiter in cls.waiters:
      if(waiter.id == chat.from_id): #send whisper to appropriate user
        try:
          waiter.write_message(chat)
        except:
          logging.error("Error sending message", exc_info=True)

  def on_message(self, message):
    logging.info("got message %r from %s", message, self.name,)
    parsed = tornado.escape.json_decode(message)

    #if name is set from remote client update
    if("name" in parsed):
      self.name = parsed['name'];

    #name and room required to post
    elif(self.name != '' and 'room' in parsed):
      chat = {
        "id"        : str(uuid.uuid4()),
        "from_id"   : str(self.id),
        "from_name" : str(self.name),
        "body"      : parsed["body"],
        "date"      : strftime("%Y-%m-%d %H:%M:%S", gmtime())
        }
      ChatHandler.update_message_cache(chat)
      ChatHandler.send_updates(chat)

    #to_name, to_id and room required to post
    elif(self.name != '' and 'to_id' in parsed and 'to_name' in parsed):
      chat = {
        "id"        : str(uuid.uuid4()),
        "from_id"   : str(self.id),
        "from_name" : str(self.name),
        "to_name"   : parsed["to_name"],
        "to_id"     : parsed["to_id"], 
        "body"      : parsed["body"],
        "room"      : parsed["room"],
        "date"      : strftime("%Y-%m-%d %H:%M:%S", gmtime())
        }
      ChatHandler.update_whisper_cache(chat)
      ChatHandler.send_whisper(chat)

class VersionHandler(tornado.web.RequestHandler):
  def get(self):
    response = { 'version': '0.0.1' }
    self.write(response)

def main():
  parse_command_line()
  app = tornado.web.Application(
    [
      (r"/atlanta", ChatHandler),
      (r"/version", VersionHandler),
      (r"/", MainHandler),
      (r"/(.*)", tornado.web.StaticFileHandler, {"path": "www"})
          ],
    static_path=os.path.join(os.path.dirname(__file__), "www"),
    debug=options.debug,
    )
  app.listen(options.port)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()