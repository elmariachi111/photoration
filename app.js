
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoskin = require('mongoskin')
    ,Services = require('./routes/services')
    ,EJSpartials = require('express-partials')
    ;


var app = express();
var mongo;
mongo = mongoskin.db(process.env.MONGOLAB_URI + "?auto_reconnect=true&poolSize=2", {w:1});

var CServices = new Services(mongo);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout', 'stdLayout'); // defaults to 'layout'
app.use(EJSpartials());

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/test', CServices.test.bind(CServices));
app.get('/foursquareVenues', CServices.getImageLanes.bind(CServices));
app.get('/getMorePhotos', CServices.getMorePhotos.bind(CServices));
app.get('/getPhotoDetails', CServices.getPhotoDetails.bind(CServices));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
