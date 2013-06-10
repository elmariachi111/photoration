var und = require('lodash'),
    request = require('request'),
    Async = require('async'),
    foursquare = require('node-foursquare-venues')
    ;

var Services = module.exports = function(db) {
    if (!db)
        return;

    this.db = db;
    this.foursquare = foursquare('HSDYUKFJ0P3RZFHEYRWI1NIKVFMLDTYCNY3ZXDGBWP3NA2M5', 'WW1CPUYWX0YXSMOSEHZ3OHTXF4HTUQF4JYB0ENLSQHY1DOFV');
    this.C = db.collection("photoration");
    this.DEFAULT_LOCATION = {
        lat:52.5302158,
        lon:13.4108785
    }
    this.EYEEM_CLIENT_ID = "66deRhwbEUdH6fIRbKn8czsL61skxwFY";
}

Services.prototype = {
    test: function(req, res) {
        res.render('test', { title: 'Express' });
    },
    getEyeemAlbums: function(fsqVenueId, callback) {
        request({"url" : "https://www.eyeem.com/api/v2/albums", "qs" :
        {
            "foursquareId" : fsqVenueId,
            "client_id" : this.EYEEM_CLIENT_ID ,
            "geoSearch" : "foursquareVenue"
        }},  function (error, response, body) {
                var resp = JSON.parse(body);
                callback (resp);
            }
        );
    },
    getEyeemPictures: function(albumId, callback) {
        request({"url" : "https://www.eyeem.com/api/v2/albums/"+albumId+"/photos", "qs" :
        {
            "client_id" :this.EYEEM_CLIENT_ID ,
            "top" : "true"
        }}, function (error, response, body) {
            var resp = JSON.parse(body);
            callback (resp);
        });
    },
    getFourSquareVenues: function(loc, options, callback) {
        var params = {
            "ll" :  loc.lat+","+loc.lon,
            limit: options.limit || 10,
            "categoryId" : "4bf58dd8d48988d1e2931735,5032792091d4c4b30a586d5c,4deefb944765f83613cdba6e,4bf58dd8d48988d190941735,4bf58dd8d48988d192941735,4bf58dd8d48988d191941735,4bf58dd8d48988d136941735,4bf58dd8d48988d137941735,507c8c4091d498d9fc8c67a9,4bf58dd8d48988d1f4931735,4bf58dd8d48988d184941735,4d4b7105d754a06372d81259,4bf58dd8d48988d1e2941735,4bf58dd8d48988d1df941735,50aaa49e4b90af0d42d5de11,4bf58dd8d48988d15c941735,4bf58dd8d48988d1e0941735,4bf58dd8d48988d161941735,4bf58dd8d48988d15d941735,4eb1d4d54b900d56c88a45fc,4bf58dd8d48988d163941735,4bf58dd8d48988d164941735,4bf58dd8d48988d165941735,4bf58dd8d48988d166941735,5032848691d4c4b30a586d61,4bf58dd8d48988d126941735,4bf58dd8d48988d131941735,4bf58dd8d48988d1f7941735,4bf58dd8d48988d12c951735"
        };
        this.foursquare.venues.search(params,function (err, doc, resp) {
            /*var responseObject = {};
            responseObject.count = doc.response.venues.length;
            responseObject.venues = [];*/
            callback(err, doc);
        });

    },
    /**
     * sets eyeemAlbum on venue result
     * @param fsqVenue
     * @param callback
     */
    getImagesForVenue: function(fsqVenue, callback) {
        this.getEyeemAlbums(""+fsqVenue.id, function(albums) {
            //var albumId = albums.foursquareVenueAlbum.id;
            fsqVenue.extPictures.eyeemAlbum = albums.foursquareVenueAlbum;
                //"foursquareId":resp.foursquareVenueAlbum.location.venueService.id,
                //"name" : resp.foursquareVenueAlbum.name,
                //"coords" : { "lat" : resp.foursquareVenueAlbum.location.latitude, "lon" : resp.foursquareVenueAlbum.location.longitude} ,
            //fsqVenue.extPictures.picCount = alnums.foursquareVenueAlbum.photos.length;

            //self.getEyeemPictures(albumId, function(resp) {
               callback();
            //});
        });
    },
    getImageLanes: function(req, res) {
        var location;
        var self = this;
        if (req.param("lat")) {
            location = {
                lat: req.param("lat"),
                lon: req.param("lon")
            };
        } else {
            location = this.DEFAULT_LOCATION;
        }
        var options = {
            limit: 2,
            perPage: req.param("perPage") || 6,
            offset: req.param("offset") || 0
        };
        this.getFourSquareVenues(location, {limit: options.limit}, function(err, fsqDoc) {
            if (err && err != 200) {
                return res.send(fsqDoc.meta.code, fsqDoc.meta.error_detail);
            }

            var venues = fsqDoc.response.venues.slice(options.offset, options.perPage);

            Async.eachLimit(venues, 6, function(fsqVenue, asyncCB) {
                fsqVenue.extPictures = { };
                self.getImagesForVenue(fsqVenue, function() {
                    //fsqVenue.extPictures.images = pictures;
                    asyncCB();
                });
            },  function(err) { //finally
                res.json({ venues: venues});
            });
        });

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


    },
    getPhotoDetails: function(req, res) {
        var responseObject = {};
        request({"url" : "https://www.eyeem.com/api/v2/photos/"+req.param("id"), "qs" :
        {
            "client_id" : "66deRhwbEUdH6fIRbKn8czsL61skxwFY"
        }}, function (error, response, body) {
            var resp = JSON.parse(body);
            res.json(resp);
        })


    }

}

