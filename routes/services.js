var und = require('lodash');

var Services = module.exports = function(db) {
    if (!db)
        return;

    this.db = db;

    this.C = db.collection("photoration");
}

Services.prototype = {
    test: function(req, res) {
        res.send("Halloe");
    }
}