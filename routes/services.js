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
        var categories = [];
        var foursquare = require('node-foursquare-venues')('HSDYUKFJ0P3RZFHEYRWI1NIKVFMLDTYCNY3ZXDGBWP3NA2M5', 'WW1CPUYWX0YXSMOSEHZ3OHTXF4HTUQF4JYB0ENLSQHY1DOFV');
        var searchObj = {
          "ll" :  "52.5302158,13.4108785",
           "categoryId" : "4bf58dd8d48988d1e2931735,5032792091d4c4b30a586d5c,4deefb944765f83613cdba6e,4bf58dd8d48988d190941735,4bf58dd8d48988d192941735,4bf58dd8d48988d191941735,4bf58dd8d48988d136941735,4bf58dd8d48988d137941735,507c8c4091d498d9fc8c67a9,4bf58dd8d48988d1f4931735,4bf58dd8d48988d184941735,4d4b7105d754a06372d81259,4bf58dd8d48988d1e2941735,4bf58dd8d48988d1df941735,50aaa49e4b90af0d42d5de11,4bf58dd8d48988d15c941735,4bf58dd8d48988d1e0941735,4bf58dd8d48988d161941735,4bf58dd8d48988d15d941735,4eb1d4d54b900d56c88a45fc,4bf58dd8d48988d163941735,4bf58dd8d48988d164941735,4bf58dd8d48988d165941735,4bf58dd8d48988d166941735,5032848691d4c4b30a586d61,4bf58dd8d48988d126941735,4bf58dd8d48988d131941735,4bf58dd8d48988d1f7941735,4bf58dd8d48988d12c951735"
        };
        foursquare.venues.search(searchObj,function (err, doc) {
            console.dir (err);
                res.json(doc);

        })


    }
}

