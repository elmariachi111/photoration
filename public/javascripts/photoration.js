PHR = { };
PHR.Router = Backbone.Router.extend({

});

$( function() {
    PHR.TPL = {
        tpl_spot_row: Mustache.compile(document.getElementById('tpl_spot_row').innerHTML)
    };
});

PHR.Venue = Backbone.Model.extend({
    /*
    id : Eyeemid
    foursquareId
    name:
    coords: { lat, lon }
    images: { offset, limit, total, items [ { id, thumbUrl, photoUrl} ]}
     */
    getGLatLng: function() {
        var coords = this.get('coords');
        return new google.maps.LatLng(coords.lat, coords.lon);

    }
});

PHR.Venues = Backbone.Collection.extend({

    url: "/foursquareVenues",
    model: PHR.Venue,
    parse: function(response) {
        var self = this;
        _.each(response.venues, function(v) {
            var venue = new PHR.Venue(v);
            self.add(venue);
        });

    }
});
PHR.Photo = Backbone.Model.extend({

});

PHR.MainResultRow = Backbone.View.extend({
    events: {
        "click .more": "more"
    },
    tagName: "div",
    className: "spot-result-row",
    initialize: function() {

    },
    render: function() {
        var html = PHR.TPL.tpl_spot_row(this.model.toJSON());
        this.$el.html(html);
        this.$scrollPane = this.$('.scroll-pane');
        return this;
    },
    more: function() {
        var cLeft = this.$scrollPane.position().left;
        this.$scrollPane.css({left: (cLeft - 100) + "px"});
    }

});

PHR.ResultsView = Backbone.View.extend({
    initialize: function() {
        this.listenTo(this.collection, "add", this.renderRow);
    },
    renderRow: function(venue) {
        var rsRow = new PHR.MainResultRow({
            model: venue
        });
        rsRow.render();
        this.$el.append(rsRow.$el);

        return this;
    }
});


PHR.PageMain = Backbone.View.extend({
    events: {
        "click #btn-curLoc":"getPos"
    },
    initialize: function() {
        this.DEFAULT_LOCATION = {
            coords: {
                latitude: 52.516012,
                longitude: 13.418126
            }
        }
        this.setupMap();
        this.markers = [];
        this.venues = new PHR.Venues();
        this.listenTo(this.venues, "add", this.venueAdded);
        this.resultsView = new PHR.ResultsView({
            el: this.$('#pnl-results'),
            collection: this.venues
        });
    },
    getPos: function() {
        var self = this;
        this.getNavigatorLocation( function(pos) {
            var gmPos = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            self.gmap.setCenter(gmPos);
            self.gmap.setZoom(15);
            self.curMarker.setPosition(gmPos);
            self.showPOIs(pos);
        });
    },
    showPOIs: function(pos) {
        this.removeMarkers();
        this.venues.fetch({data: {lat:pos.coords.latitude, lon:pos.coords.longitude}});
    },
    venueAdded: function(venue) {
        var marker = new google.maps.Marker({
            position: venue.getGLatLng(),
            map: this.gmap
        });
        this.markers.push(marker);
    },
    removeMarkers: function() {
        _.each(this.markers, function(marker) {
            marker.setMap(null);
        })
    },
    getNavigatorLocation: function(callback) {
        var self = this;
        navigator.geolocation.getCurrentPosition(
            function(coords) {
                if (typeof coords == "undefined")
                    return callback(self.DEFAULT_LOCATION);
                else
                    return callback(coords);
            },
            function() { console.log("error"); callback(self.DEFAULT_LOCATION); },
            {'enableHighAccuracy':true,'timeout':10000,'maximumAge':0}
        );
        return true;
    },
    setupMap: function() {
        var defaultLocLL = new google.maps.LatLng(this.DEFAULT_LOCATION.coords.latitude, this.DEFAULT_LOCATION.coords.longitude);

        var mapOptions = {
            center: defaultLocLL,
            zoom: 10,
            mapTypeControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.gmap = new google.maps.Map(document.getElementById('gmap'),  mapOptions);

        this.curMarker = new google.maps.Marker({
            position: defaultLocLL,
            map: this.gmap,
            animation: google.maps.Animation.DROP
        });

        google.maps.event.addListener(self.gmap, 'click', this.onMapClicked.bind(this));

    },
    onMapClicked: function() {

    },
    show: function() {
        $('.page').addClass('hide');
        this.$el.removeClass('hide');
    }
});

PHR.App = Backbone.View.extend({
   initialize: function() {
       this.pageMain = new PHR.PageMain({el: $('#page-main')});
       this.pagePhoto = new PHR.PagePhoto({el: $('#page-photo')});
       this.router = new PHR.Router();

       this.router.route("page-main", "main", this.pageMain.show.bind(this.pageMain))
       this.router.route("page-photo/:eyeemid", "photo", this.pagePhoto.show.bind(this.pagePhoto))
   }

});


