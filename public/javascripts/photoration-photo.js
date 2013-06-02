PHR.PagePhoto = Backbone.View.extend({

    initialize: function() {
        this.$imgDiv = this.$('#theImage');
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

            $('#time').html(dt.toLocaleTimeString());
            $('#date').html(dt.toLocaleDateString());
            $('#filter').html(resp.photo.filter);
            $('#likes').html(resp.photo.likers.total);

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
            var coords = curVenue.get('coords');
            var ll = new google.maps.LatLng(coords.lat, coords.lon);
            var marker = new google.maps.Marker({
                position: ll,
                map:  gmap,
                animation: google.maps.Animation.DROP
            });
        }

        return gmap;
    }
});