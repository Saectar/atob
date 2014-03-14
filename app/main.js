"use strict";

var sequelize = require_app("models/model");


module.exports = {
  setup_app: function() {
    sequelize.instance.sync({ force: true }).success(function() {
      console.log("Synced SQL DB to models"); 
      var Board = require_app("models/board");

      Board.create({
        name: "a",
      });
      Board.create({
        name: "b",
      });
      Board.create({
        name: "c",
      });

    });
  },
  setup_request: function(req) {
    console.log("Handling request", req.path, req.query, req.params);
  },
  setup_plugins: function(app) {
    app.add_plugin_dir("app/plugins/slog");
    app.add_plugin_dir("app/plugins/tester");
  }
};
