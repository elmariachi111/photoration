var und = require('lodash');
var request = require('request');
var foursquare = require('node-foursquare-venues')('HSDYUKFJ0P3RZFHEYRWI1NIKVFMLDTYCNY3ZXDGBWP3NA2M5', 'WW1CPUYWX0YXSMOSEHZ3OHTXF4HTUQF4JYB0ENLSQHY1DOFV');

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
        var searchObj = {
            "ll" :  ""+req.param("lat")+","+req.param("lon"),
            "categoryId" : "4bf58dd8d48988d1e2931735,5032792091d4c4b30a586d5c,4deefb944765f83613cdba6e,4bf58dd8d48988d190941735,4bf58dd8d48988d192941735,4bf58dd8d48988d191941735,4bf58dd8d48988d136941735,4bf58dd8d48988d137941735,507c8c4091d498d9fc8c67a9,4bf58dd8d48988d1f4931735,4bf58dd8d48988d184941735,4d4b7105d754a06372d81259,4bf58dd8d48988d1e2941735,4bf58dd8d48988d1df941735,50aaa49e4b90af0d42d5de11,4bf58dd8d48988d15c941735,4bf58dd8d48988d1e0941735,4bf58dd8d48988d161941735,4bf58dd8d48988d15d941735,4eb1d4d54b900d56c88a45fc,4bf58dd8d48988d163941735,4bf58dd8d48988d164941735,4bf58dd8d48988d165941735,4bf58dd8d48988d166941735,5032848691d4c4b30a586d61,4bf58dd8d48988d126941735,4bf58dd8d48988d131941735,4bf58dd8d48988d1f7941735,4bf58dd8d48988d12c951735"
        };
        foursquare.venues.search(searchObj,function (err, doc, resp) {
            console.dir (err);
            var params = {};
            var responseObject = {};
            responseObject.count = doc.response.venues.length;
            responseObject.venues = [];
            var resp;
            var j=0;
            for (var i=0;i<doc.response.venues.length;i++)
            {
                request({"url" : "https://www.eyeem.com/api/v2/albums", "qs" :
                {
                    "foursquareId" : ""+doc.response.venues[i].id,
                    "client_id" : "66deRhwbEUdH6fIRbKn8czsL61skxwFY",
                    "geoSearch" : "foursquareVenue"
                }}, function (error, response, body) {
                        resp = JSON.parse(body);
                        responseObject.venues.push({
                            "id" : resp.foursquareVenueAlbum.id,
                            "name" : resp.foursquareVenueAlbum.name,
                            "picCount" : resp.foursquareVenueAlbum.photos.length,
                            "images" : resp.foursquareVenueAlbum.photos
                        });
                        j++;
                        if (j>=doc.response.venues.length-1) res.json(responseObject);
                })

            }

        })

    },
    getNextPicturesForLocation: function(req, res) {
        var responseObject = {};
        request({"url" : "https://www.eyeem.com/api/v2/albums/"+req.param("id")+"/photos", "qs" :
        {
            "client_id" : "66deRhwbEUdH6fIRbKn8czsL61skxwFY",
            "offset": req.param("offset"),
            "limit" : 10
        }}, function (error, response, body) {
            var resp = JSON.parse(body);
            responseObject = {
                "images" : resp.photos
            };
            res.json(responseObject);
        })


    }

}

