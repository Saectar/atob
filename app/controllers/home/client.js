var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var summarize = require("app/client/summarize");

function format_and_show($el) {
  $el.find(".text").each(function() {
    var self = this;
    require("app/client/text", function(format_text) {
      format_text.add_upboats(false);
      format_text.add_markdown($(self));
    });
  });
  $el.removeClass("hidden").hide().fadeIn();
}

module.exports = {
  events: {
    "click .imglink" : "handle_mouseenter_imglink",
    "click .identity_tripcode" : "regen_tripcode",
    "click .upboat" : "handle_upboat_link",
    "click .tripcode" : "handle_click_tripcode",
    "mouseenter .imglink" : "handle_mouseenter_imglink",
    "mouseleave .imglink" : "handle_mouseleave_imglink",
  },

  handle_click_tripcode: function(e) {
    var target = $(e.target).closest(".tripcode");
    var tripcode = target.data("tripcode");

    window.open("/u/" + tripcode, "_blank");
  },

  handle_upboat_link: function(e) {
    var link = $(e.target).closest(".link");
    var arrow = link.find(".upboat");
    var linkId = link.data("linkid");

    SF.socket().emit("upboat", linkId, function() {
      arrow.fadeOut(function() {
        arrow.html("<span class='icon-heart' />");
        arrow.fadeIn();

      });
    });

  },
  handle_mouseenter_imglink: function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(e.target).popover("destroy");
    var responseEl = $("<div />");
    var img_link = $(e.target).closest(".imglink").attr("href");

    var img_tag = $("<img />") .attr("src", img_link);
    img_tag.css("max-height", "200px");
    img_tag.css("max-width", "100%");
    img_tag.css("display", "block");
    responseEl.append(img_tag);

    $(e.target).popover({
      html: true,
      content: responseEl.html(),
      placement: "bottom",
      container: this.$el });

    $(e.target).popover("show");

  },
  handle_mouseleave_imglink: function(e) {
    $(e.target).popover("destroy");
  },

  format_text: function() {
    require("app/client/text", function(format_text) {
      format_text.add_upboats(false);
      var self = this;
      $(".text").each(function() {
          format_text.add_markdown($(self));
      });
    });
  },
  show_recent_threads: function() {
    format_and_show($(".threads.recent.hidden"));
  },
  show_recent_posts: function() {
    format_and_show($(".posts.recent.hidden"));
  },
  show_recent_links: function() {
    format_and_show($(".links.recent.hidden"));
  },
  gen_tripcodes: function() {
    $(".tripcode").each(function() {
      tripcode_gen(this);
    });
  },
  gen_tagcloud: function() {
    bootloader.require("app/static/vendor/jquery.tagcloud", function() {
      $(".tagcloud a").tagcloud({
        color: {start: '#8aa', end: '#aaf'} ,
        size: { start: 2, end: 4, unit: 'em' } 
      }).css("margin", "10px");;

      $(".tagcloud")
        .fadeOut(function() {
          $(this)
            .removeClass("hidden")
            .fadeIn();
        });
    });
  },
  socket: function(s) {
    s.on("new_reply", function(reply) {
      console.log("NEW REPLY", reply);
      var postParent = $(".posts .post").parent();
      reply.id = reply.post_id || reply.id;
      var summary = $(summarize(reply));
      summary.hide();
      postParent.prepend(summary);
      summary.fadeIn();

      postParent.find(".post").last().fadeOut().remove();
    });

    s.on("new_post", function(post) {
      var postParent = $(".threads .post").parent();
      post.id = post.post_id || post.id;
      var summary = $(summarize(post));
      summary.hide();
      postParent.prepend(summary);
      summary.fadeIn();

      postParent.find(".post").last().fadeOut().remove();
    });

    s.on("anons", this.handle_anonicators);
  }
};
_.extend(module.exports, settings);
