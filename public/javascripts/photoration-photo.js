PHR.PagePhoto = Backbone.View.extend({

    initialize: function() {
        this.$img = this.$('#theImage');
    },
    show: function(eyeemid) {
        $('.page').addClass('hide');
        this.$el.removeClass('hide');

        var self = this;

        $.get("/getPhotoDetails", {id:eyeemid}, function(resp) {
            console.dir(resp);
            var image = new PHR.Photo(resp.photo);
            self.$img.attr("src", image.get('photoUrl'));
        });
    }
});