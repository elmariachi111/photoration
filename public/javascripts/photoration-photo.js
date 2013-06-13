PHR.PagePhoto = Backbone.View.extend({

    initialize: function() {
        this.$imgDiv = this.$('#theImage');
        this.$settingsUl = this.$('#theSettings ul');

        this.mainPage = this.options.mainPage;
    },
    show: function(eyeemid) {
        $('.page').addClass('hide');
        this.$el.removeClass('hide');

        var self = this;

        $.get("/getPhotoDetails", {id:eyeemid}, function(resp) {
            var image = new PHR.Photo(resp.photo);
            var dt = new Date(resp.photo.updated);

            var $img = $('<img src="'+image.get('photoUrl')+'">');
            self.$imgDiv.html($img);

            var settings = [];
            settings.push( { icon: '/img/time_icon.png', title:'Time', value: dt.toLocaleTimeString()});
            settings.push( { icon: '/img/date_icon.png', title:'Date', value: dt.toLocaleDateString()});
            settings.push({ icon:'/img/venue_icon.png', title:"Venue", value: "-"});
            settings.push( { icon: '/img/filter_icon.png', title:'Filter', value: resp.photo.filter});
            settings.push( { icon: '/img/like_icon.png', title:'Likers', value: resp.photo.likers.total});

            var html = PHR.TPL.tpl_photo_settings({settings: settings});
            self.$settingsUl.html(html);
            var ll = new google.maps.LatLng(resp.photo.latitude, resp.photo.longitude);
            var gmap = self.showMap(ll);

        });
    },
    showMap: function(ll) {
        var mapOptions = {
            center: ll,
            zoom: 15,
            mapTypeControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var gmap = new google.maps.Map(document.getElementById('gmap2'),  mapOptions);
        this.curMarker = new google.maps.Marker({
            position: ll,
            map:  gmap,
            animation: google.maps.Animation.DROP,
            icon: "/img/marker.png"
        });

        var curVenue = this.mainPage.getCurVenue();
        if (curVenue) {
            var ll = curVenue.getGLatLng();
            var marker = new google.maps.Marker({
                position: ll,
                map:  gmap,
                animation: google.maps.Animation.DROP
            });
        }

        return gmap;
    }
});