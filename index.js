var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var cluster = require('cluster');
var cradle = require('cradle');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(allowCrossDomain);

cradle.setup({
    host: 'localhost',
    cache: true,
    raw: false,
    forceSave: true
});

var FlightProvider = require('./flight').FlightProvider;
var flightProvider= new FlightProvider();

var ReservationProvider = require('./reservation').ReservationProvider;
var reservationProvider= new ReservationProvider();

app.listen(3001);
console.log('Web Server Data dimulai pada port 3001 : bisa diakses di http://localhost:3001/');