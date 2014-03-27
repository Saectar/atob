"use strict";

var escape_html = require("escape-html");
var IP = require_app("models/ip");
var Post = require_app("models/post");
var User = require_app("models/user");
var Ban = require_app("models/ban");
var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");
var config = require_core("server/config");

var OPS = {
  ban: function(post, hours) {
    hours = parseInt(hours, 10) || 1;

    IP.find({where: { post_id: post.id} })
      .success(function(ip) {
        console.log("BANNING USER FOR POST", ip);

        post.title = "[banned from " + post.board_id + "] " + post.title;
        var old_board_id = post.board_id;

        post.board_id = "ban";
        post.parent_id = null;
        post.thread_id = null;
        
        post.save();
        Ban.create({
          ip: ip.ip,
          browser: ip.browser,
          hours: hours,
          board: old_board_id
        });
      });

    return true;
  },
  delete: function(post) {
    post.destroy();
    return true;
  }
};

module.exports = {
  handle_new_post: function(socket, post) {
    if (!post.tripcode || !post.author) {
      return;
    }

    console.log("Handling new post", post);

    User.find({ 
      where: {
        tripcode: post.tripcode,
        tripname: post.author
      }
    }).success(function(user) {
      // Parse response to figure out what to do.
      // Format should be: 
      //
      // If the response goes unhandled, it should go to a different board
      // and do nothing here.
      var tokens = post.title.split(" ");

      var op = tokens.shift();
      var post_id = tokens.shift();

      Post.find({ 
        where: {
          id: post_id
        }}).success(function(p) {
          var args = tokens;
          args.unshift(p);

          // all authors are renamed to "atob". no reason.
          post.text = escape_html(post.text);
          post.title = escape_html(post.title);
          if (user) {
            post.author = "atob";
          }
          var secret = config.mod_secret || "mod_secret";

          post.tripcode = gen_md5(post.tripcode + secret + post.author);
          post.bumped_at = Date.now();

          var success = false;
          if (OPS[op] && p && user) {
            success = OPS[op].apply(null, args);
          }
      
          var board;
          if (success && user) {
            board = config.mod_board || 'mod';
          } else {
            board = config.fail_board || 'cop';
          }

          post.board_id = board;

          Post.create(post).success(function(p) {
            var boards_controller = load_controller("boards");
            var boards_socket = boards_controller.get_socket();
            p.dataValues.post_id = p.dataValues.id;
            delete p.dataValues.id;
            p.dataValues.client_options = _.clone(p.dataValues);

            boards_socket.broadcast.to(board).emit("new_post", p.dataValues);
          });
        });


    });

  }
};
