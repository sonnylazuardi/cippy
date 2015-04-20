var express   = require('express');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var config = require('./server/config');
var jwt = require('jwt-simple');
var qs = require('querystring');
var moment = require('moment');
var request = require('request');

// create the express app
var app = express();

// create the http server
var server = require('http').createServer(app);

// configure the express app
app.use(express.static(__dirname + '/public'));

// various express helpers
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('X-HTTP-Method-Override'));

// set up the routes
require('./server/routes')(app);

// start the app
server.listen(config.appPort);

console.log('Server started on port:', config.appPort)