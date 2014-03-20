"use strict";

var settings = require("app/client/settings");
module.exports = {
  events: {

  },
  init: function() {

  },
  set_board: function(board) {
    this.board = board;
    this.trigger("set_board");
  },
  socket: function(s) {
    s.on("doings", function(data) {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts);
      }

    });

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      post.add_reply(data);
    });

    s.on("joined", function(c) {
      console.log("Joined the board", c);
    });

    var self = this;
    self.do_when(self.board, "set_board", function() {
      s.emit("join", self.board);
    });
  }
};

_.extend(module.exports, settings);
