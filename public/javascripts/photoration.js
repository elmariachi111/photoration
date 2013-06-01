PHR = { };

PHR.Router = Backbone.Router.extend({

});

PHR.PageMain = Backbone.View.extend({
    initialize: function() {
        var mapOptions = {
            center: new google.maps.LatLng(-34.397, 150.644),
            zoom: 8,
            mapTypeControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.gmap = new google.maps.Map(document.getElementById('gmap'),  mapOptions);
    },

    show: function() {
        $('.page').addClass('hide');
        this.$el.removeClass('hide');
    }
});

PHR.PagePhoto = Backbone.View.extend({
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


