"use strict";

var REPLY_MAX = 200;
var POST_TIMEOUT = 20 * 1000;
var REPLY_TIMEOUT = 3 * 1000;

var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");

var Ban = require_app("models/ban");
var Post = require_app("models/post");
var IP = require_app("models/ip");

var DOWNCONS = [
  ":thumbs-down:",
  ":law:"
];

var UPCONS = [ ];


var escape_html = require("escape-html");
function handle_new_post(s, board, post, last_post) {
  if (Date.now() - last_post < POST_TIMEOUT) {
    return last_post;
  }

  var title = post.title;
  var text = post.text;
  var tripcode = post.tripcode || "";
  var author = post.author || "anon";
  var data = {
    title: title,
    text: text,
    tripcode: gen_md5(author + ":" + tripcode),
    board_id: board,
    author: author,
    replies: 0,
    downs: 0,
    ups: 0,
    bumped_at: Date.now()
  };

  Post.create(data)
    .success(function(p) {
      IP.create({
        post_id: p.id,
        ip: s.spark.address.ip,
        browser: s.spark.headers['user-agent']
      });

      data.post_id = p.id;
      s.broadcast.to(board).emit("new_post", data);
      s.emit("new_post", data);
    });


  return Date.now();
}

function handle_new_reply(s, board, post, last_reply) {
  if (Date.now() - last_reply < REPLY_TIMEOUT) {
    return last_reply;
  }

  var author = post.author || "anon";
  var text = post.text.split("||");
  var title = "";
  if (text.length > 1) {
    title = text.shift();
    text = text.join("|");
  }

  // Do things to the parent, now...
  var down = false, up = false;

  _.each(DOWNCONS, function(downcon) {
    if (text.toString().match(downcon)) {
      down = true;
    }
  });

  Ban.find({
    where: {
      ip: s.address.ip
    }
  }).success(function(ban) {
    console.log("IS USER BANNED?", ban);
    // User has no bans 
  });

  Post.find({ where: { id: post.post_id }})
    .success(function(parent) {
      if (!down && parent.replies < REPLY_MAX) {
        parent.replies += 1;
        parent.bumped_at = Date.now();
      }

      if (down) {
        parent.downs += 1;
      }

      if (up) {
        parent.ups += 1;
      }

      parent.save();

    });

  Post.create({
      text: escape_html(text),
      title: escape_html(title),
      parent_id: post.post_id,
      thread_id: post.post_id,
      tripcode: gen_md5(author + ":" + post.tripcode),
      author: author
    }).success(function(p) {
      p.dataValues.post_id = p.dataValues.id;
      delete p.dataValues.id;

      var boards_controller = load_controller("boards");
      var boards_socket = boards_controller.get_socket();
      boards_socket.broadcast.to(board).emit("new_reply", p.dataValues);

      // updating the posts controller, too, because its possible to
      // watch only one post
      var posts_controller = load_controller("posts");
      var post_socket = posts_controller.get_socket();
      post_socket.broadcast.to(board).emit("new_reply", p.dataValues);
    });

  return Date.now();
}


module.exports = {
  handle_new_reply: handle_new_reply,
  handle_new_post: handle_new_post
};

