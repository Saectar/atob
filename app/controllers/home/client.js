
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
  click_handler_uno: function() {
    console.log("Handling a click");
  },
  show_recent: function() {
    $(".recent.hidden .text").each(function() {
      add_icons($(this));
    });
    $(".recent.hidden").removeClass("hidden").hide().fadeIn();
  }
};
