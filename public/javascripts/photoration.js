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
        var location = this.get('location');
        return new google.maps.LatLng(location.lat, location.lng);

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
    },
    tagName: "div",
    className: "spot-result-row",
    initialize: function() {

    },
    render: function() {
        var html = PHR.TPL.tpl_spot_row(this.model.toJSON());
        var that = this;
        this.$el.html(html);

        this.$scrollPane = this.$('.scroll-pane');
        this.$scrollPane.swipe({

            swipe:function(event, direction, distance, duration, fingerCount){
                event.stopPropagation(); //prevent tap event

                var cLeft = that.$scrollPane.position().left;
                if (direction=="left") {
                    that.$scrollPane.css({left: (cLeft - distance*1.5) + "px"});
                } else if (direction=="right"){
                    that.$scrollPane.css({left: (cLeft + distance*1.5) + "px"});
                }
                return false;
            },
            threshold:20,
            allowPageScroll:"vertical",
            triggerOnTouchEnd : true
        });

        this.$(".scroll-pane .spot-result").on("tap", this.venueSelected.bind(this));
        return this;
    },
    more: function() {
        var cLeft = this.$scrollPane.position().left;
        this.$scrollPane.css({left: (cLeft - 100) + "px"});
    },
    venueSelected: function(evt) {
        this.options.parentView.curVenue = this.model;
        this.options.parentView.trigger("selected", $(evt.currentTarget).data('target'));
    }

});

PHR.ResultsView = Backbone.View.extend({
    //curVenue
    initialize: function() {
        this.listenTo(this.collection, "add", this.renderRow);
    },
    renderRow: function(venue) {
        var rsRow = new PHR.MainResultRow({
            model: venue,
            parentView: this
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
        };
        this.$loading = this.$('#loading');
        this.setupMap();
        this.markers = [];
        this.venues = new PHR.Venues();
        this.listenTo(this.venues, "add", this.venueAdded);
        this.resultsView = new PHR.ResultsView({
            el: this.$('#pnl-results'),
            collection: this.venues,
            parentView: this
        });
        this.listenTo(this.resultsView, "selected", function(fragment) {
            this.trigger("selected", fragment);
        });

        this.getPos();
    },
    getCurVenue: function() {
        return this.resultsView.curVenue;
    },

    getPos: function() {
        this.$loading.show();
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
        var self = this;
        this.venues.fetch({data: {lat:pos.coords.latitude, lon:pos.coords.longitude},
        success: function(){
            self.$loading.hide();
        }});
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
       this.listenTo(this.pageMain, "selected", function(fragment) {
           this.router.navigate(fragment, {trigger:true});
       })
       this.pagePhoto = new PHR.PagePhoto({
           mainPage: this.pageMain,
           el: $('#page-photo')
       });

       this.router = new PHR.Router();

       this.router.route("page-main", "main", this.pageMain.show.bind(this.pageMain));
       this.router.route("page-photo/:eyeemid", "photo", this.pagePhoto.show.bind(this.pagePhoto));
   }

});


