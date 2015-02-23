var cradle = require('cradle');

FlightProvider = function() {
  this.connection= new (cradle.Connection)();
  this.db = this.connection.database('flight');
};

FlightProvider.prototype.findAll = function(callback) {
    this.db.view('flight/all',function(error, result) {
      if( error ){
        callback(error)
      }else{
        console.log(result);
        var docs = [];
        result.forEach(function (row){
          docs.push(row);
        });
        callback(null, docs);
      }
    });
};

FlightProvider.prototype.findById = function(id, callback) {
    this.db.get(id, function(error, result) {
        if( error ) callback(error)
        else callback(null, result)
      });
};

FlightProvider.prototype.save = function(flights, callback) {
    var db = this.db;
    if( typeof(flights.length)=="undefined")
      flights = [flights];

    for( var i =0;i< flights.length;i++ ) {
      flight = flights[i];
    }
    
    this.db.save(flights, function(error, result) {
      if( error ) callback(error)
      else {
        db.save('_design/flight', {
          all: {
            map: function (doc) {
              emit(doc.name, doc);
            }
          }
        });
        callback(null, flights)
      };
    });
};

exports.FlightProvider = FlightProvider;