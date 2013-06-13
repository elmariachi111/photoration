PHR = { };
PHR.Router = Backbone.Router.extend({

});

$( function() {
    PHR.TPL = {
        tpl_spot_result: Mustache.compilePartial('tpl_spot_result',document.getElementById('tpl_spot_result').innerHTML),
        tpl_spot_row: Mustache.compile(document.getElementById('tpl_spot_row').innerHTML)
    };
});

PHR.Venue = Backbone.Model.extend({

    initialize: function() {
      this.on('swiped', this.swiped);
    },
    getGLatLng: function() {
        var location = this.get('location');
        return new google.maps.LatLng(location.lat, location.lng);
    },
    getAlbum: function() {
        return this.get('extPictures').eyeemAlbum;
    },
    loadMore: function() {
        var that= this;
        var eyeemAlbum = this.getAlbum();
        if (eyeemAlbum.totalPhotos > eyeemAlbum.photos.items.length) {
            $.get('getMorePhotos', {offset:eyeemAlbum.photos.items.length, albumId:eyeemAlbum.id}).done( function(result) {
                _.each(result.photos.items, function(item) {
                    eyeemAlbum.photos.items.push(item);
                })
                that.trigger("loaded:items", result.photos.items);
            }) ;
        } else {
            //no more photos to load
        }
    },
    swiped: function(newPos) {
        var eyeemAlbum = this.getAlbum();
        var photoDisplayLength = eyeemAlbum.photos.items.length * 160;
        if (Math.abs(newPos) > photoDisplayLength - 800)
            this.loadMore();

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
            venue.on("swiped" , function() { self.trigger("swiped", venue) });
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
        this.listenTo(this.model, "loaded:items", this.renderMoreItems)
    },
    renderMoreItems: function(items) {
        var $scrollPane = this.$scrollPane;
        _.each(items, function(item) {
            var html = PHR.TPL.tpl_spot_result(item);
            $scrollPane.append(html);
        });
    },
    render: function() {
        var html = PHR.TPL.tpl_spot_row(this.model.toJSON());
        var that = this;
        this.$el.html(html);

        this.$scrollPane = this.$('.scroll-pane');

        this.$scrollPane.hammer().on("dragleft dragright", function(ev){ ev.gesture.preventDefault(); })
            .on("swipeleft swiperight", function(ev) {
                var cLeft = that.$scrollPane.position().left;
                var distance = ev.gesture.deltaX;
                var newPos = Math.min(125,(cLeft + distance*1.8));
                that.$scrollPane.css({left: newPos + "px"});
                that.model.trigger("swiped", newPos);
            });

        this.$scrollPane.hammer().on("tap", this.venueSelected.bind(this));
        return this;
    },
    venueSelected: function(evt) {
        var target = $(evt.target).data('target');
        this.options.parentView.curVenue = this.model;
        this.options.parentView.trigger("selected", target);
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
        "click #btn-curLoc":"getPos",
        "click #btn-loadmore-venues": "loadMoreVenues"
    },
    initialize: function() {
        var self = this;
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
        this.listenTo(this.venues, "swiped", function(venue) {
            var ll = venue.getGLatLng();
            self.gmap.setCenter(ll);
        });
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
    loadMoreVenues: function() { //todo: trigger and implement
        this.venues.fetch({data: {lat:pos.coords.latitude, lon:pos.coords.longitude}});
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


