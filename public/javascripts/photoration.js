PHR = { };

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

PHR.Router = Backbone.Router.extend({

});

PHR.ResultsView = Backbone.View.extend({
    initialize: function() {
        this.collection.on( "add", this.renderRow);
    },
    renderRow: function(venue) {
        return this;
    }
});

PHR.MainResultRow = Backbone.View.extend({
    tagName: "div",
    className: "spot-result-row",
    render: function() {

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

PHR.PagePhoto = Backbone.View.extend({

    initialize: function() {
        this.$img = this.$('#theImage');

    },
    show: function(eyemid) {
        $('.page').addClass('hide');
        this.$el.removeClass('hide');

        var imgSrc = 'http://cdn.eyeem.com/thumb/640/480/9902ae66b227adc660e823debf6a4a621032614b-1370109604';
        this.$img.attr("src", imgSrc);

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


