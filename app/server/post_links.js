
var $ = require("cheerio");
var Link = require_app("models/link");
var marked = require_app("static/vendor/marked");

function find_and_create_links(post) {
  if (post.dataValues) {
    post = post.dataValues;
  }

  if (post.board_id === 'log' || post.board_id === 'ban') {
    return;
  }

  var div = $("<div />").html(post.text || "");
  if (div.text()) {
    CUR_POST = post;
    marked(div.text(), { renderer: renderer });
  }
}

var CUR_POST;
var renderer = new marked.Renderer();

function add_link(href, title, string, is_image) {
  var this_post = CUR_POST;
  Link.findAll( { where: {
    href: href
    }
  })
  .success(function(links) {
    links = _.filter(links, function(link) {
      return link.post_id === this_post.id;
    });

    href = href.trim();
    if (href.indexOf("javascript:") === 0) {
      return;
    }

    if (!links || !links.length) {
      Link.create({
        href: href,
        title: string,
        ups: 0,
        downs: 0,
        author: this_post.author,
        tripcode: this_post.tripcode,
        post_id: this_post.id || this_post.post_id,
        board: this_post.board_id,
        image: !!is_image
      });

    }

  });
}

function add_image_link(href, title, string) {
  add_link(href, title, string, true);
}

renderer.link = add_link;
renderer.image = add_image_link;

module.exports = {
  find_and_create_links: find_and_create_links
}
