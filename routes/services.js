var und = require('lodash');

var Services = module.exports = function(db) {
    if (!db)
        return;

    this.db = db;

    this.C = db.collection("photoration");
}

Services.prototype = {
    test: function(req, res) {
        res.render('test', { title: 'Express' });
    },
    getFourSquareVenues: function(req, res) {

        var venues = [{
            name: 'Alexanderplatz',
            location: null
        }];

        res.json(venues);

    }
}
