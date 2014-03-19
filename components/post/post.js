"use strict";

function add_icons($el) {
  var escaped = $el.text();
  if (escaped) {
    var icon_str = "<i class='icon icon-NAME' title=':NAME:' />";
    var replaced = escaped.replace(/:([\w-]+):/g, function(x, icon) {
      return icon_str.replace(/NAME/g, icon.toLowerCase());
    });
    $el.html(replaced);
  }
}

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  get_post_id: function() { return this.$el.find(".post").data("post-id"); },
  initialize: function() { },
  client: function(options) {
    var POSTS = window._POSTS || {};
    var self = this;
    window._POSTS = POSTS;
    POSTS[options.post_id] = this; 

    // need to find the icons in the text and fix them
    var textEl = this.$el.find(".text");

    textEl.each(function() {
      add_icons($(this));
    });


    var repliesEl = self.$el.find(".replies");
    self.$el.find(".collapse").on("shown.bs.collapse", function() {
      self.bumped();
    });

    self.$el.find(".timeago").timeago();
    self.$el.find(".post").fadeIn();
    self.$el.find("div.tripcode").each(function() {
      gen_tripcode(this);
    });
  },
  bumped: function() {
    var repliesEl = this.$el.find(".replies");
    repliesEl.animate({ scrollTop: repliesEl[0].scrollHeight});
  },
  add_reply: function(data) {
    var replyEl =$("<div class='ptl pbl'/>");
    var tripEl = $("<div class='tripcode' />")
      .data("tripcode", data.tripcode)
      .attr("title", data.author);

    tripEl.css("marginRight", "8px");
    gen_tripcode(tripEl);

    replyEl.append(tripEl);
    var infoEl = $("<a href='#' class='mrm' style='margin-right: 5px' >");
    infoEl.html("#" + data.post_id);
    infoEl.attr("title", (new Date(data.created_at)).toLocaleString());
    replyEl.append(infoEl);
    replyEl.append($("<b />").text(data.title));

    // need to find the icons in the text and fix them
    var smallEl = $("<small />").text(data.text);
    add_icons(smallEl);

    replyEl.append(smallEl);
    replyEl.fadeIn();

    var repliesEl = this.$el.find(".replies");
    repliesEl.append(replyEl);
    this.bumped();

    var timeagoEl = this.$el.find(".last_reply .timeago");
    timeagoEl.attr("title", Date.now());
    timeagoEl.html($.timeago(Date.now()));

    var replies = parseInt(this.$el.find(".reply_count").html() || "0", 10);
    this.$el.find(".reply_count").text(replies + 1);

  },
  update_counts: function(counts) {
    counts.sort();
    var str = _.map(counts, function(c) { return c[0]; });
    this.$el.find(".counts").text(str.join(""));
    // Update who is typing, who is idle and who is gone.
  },

};
