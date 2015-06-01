
app.service('Arrangement', function($rootScope, $q, $state, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http, CouchURL, _ArrangementDB, $interval, Socket){
  var self = this;
  var timeInit = 0;
  var timeSend = 0;
  var timeReceive = 0;


  var arrangement = {
    doc: {},

    offline: {},

    delta: {},

    offlineStamp: {},

    shadow: {},

    lastRev: {},

    queue: {},

    timesock: null,

    stackCounter: 0,

    onlineState: true,

    onlineSync: true,

    _rev: '',

    _pieces: {},

    getPiece: function(id){
      return this._pieces[id];
    },

    registerPiece: function(id, piece){
      this._pieces[id] = piece;
    },

    unregisterPiece: function(id, piece){
      delete this._pieces[id];
    },

    length: function(){
      var length = 0;
      var currentLength = 0;
      Object.keys(this._pieces).forEach(function(key){
        var piece = this._pieces[key];
        currentLength = piece.data.position + piece.length();
        length = currentLength > length ? currentLength : length;
      }.bind(this));
      return length;
    },

    addTrack: function(type, callback){
      var base = {
        id: IDGenerator.generate('track'),
        title: 'Untitled',
        type: type,
        pieces: []
      };

      this.doc.tracks.push(base);
      callback(base.id);
    },

    addBuffer: function(buffer){
      this.doc.buffers.push(buffer);
    },

    getBufferFromId: function(id){
      return _.findWhere(this.doc.buffers, { id: id });
    },

    getTrackFromId: function(id){
      return _.findWhere(this.doc.tracks, { id: id });
    },

    addBufferToTrack: function(bufferId, trackId, position){
      var buffer = this.getBufferFromId(bufferId);
      if(buffer)
        this._addBufferToTrack(buffer, trackId, position);
    },

    _addBufferToTrack: function(buffer, trackId, position){
      // create a new piece
      var piece = {
        buffer_id: buffer.id,
        type: "buffer",
        position: position || 0,
        id: IDGenerator.generate('piece')
      };

      // add a new piece to the track
      var track = this.getTrackFromId(trackId);
      if(track)
        $timeout(function(){
          track.pieces.push(piece);
        });
    },

    uploadBuffer: function(file){
      return BufferUploader.upload(this.doc._id, file).then(function(buffer){
        // add the buffer ti the list of buffer
        this.addBuffer(buffer);
        return buffer;
      }.bind(this));
    },

    uploadBufferAndAddToTrack: function(file, trackId, position){
      this.uploadBuffer(file).then(function(buffer){
        this._addBufferToTrack(buffer, trackId, position);
      }.bind(this));
    },

    removePieceFromTrack: function(piece, track){
      track.pieces = _.without(track.pieces, piece);
    },

    removeBuffer: function(buffer){
      var associatedPieces = [];
      this.doc.tracks.forEach(function(track){
        track.pieces.forEach(function(piece){
          if(piece.buffer_id && piece.buffer_id == buffer.id)
            associatedPieces.push(piece);
        })
      });

      var message = "Are you sure you want to delete this file?";
      if(associatedPieces.length)
        message += "\nDeleting this file, will also delete all associated pieces (" + associatedPieces.length + ")!";

      if(confirm(message)){
        // delete the buffer
        this.doc.buffers = _.without(this.doc.buffers, buffer);

        // delete the associated pieces
        associatedPieces.forEach(function(assocPiece){
          this.doc.tracks.forEach(function(track){
            track.pieces.forEach(function(piece){
              if(piece == assocPiece)
                this.removePieceFromTrack(piece, track);
            }.bind(this))
          }.bind(this));
        }.bind(this));

        $http.delete('/delete_s3/' + buffer.id);
      }
    }
  };

  Socket.arrangement = arrangement;
  arrangement.context = SharedAudioContext.getContext();
  arrangement.master = arrangement.context.createGain();
  arrangement.compressor = arrangement.context.createDynamicsCompressor();
  arrangement.master.connect(arrangement.compressor);
  arrangement.compressor.connect(arrangement.context.destination);
  arrangement.db = {}

  arrangement.checkOffline = function(timestamp) {
    var def = $q.defer();
    var test = new PouchDB(CouchURL + _ArrangementDB);
    test.get(arrangement.arrangement_id).then(function(data) {
      console.log(data.timestamp);
      console.log('bandingkan offline : retrieved => ' + arrangement.offlineStamp + ' : ' + data.timestamp);
      def.resolve(arrangement.offlineStamp < data.timestamp);
        
    });
    return def.promise;
  }

  arrangement.conflict = function() {
    var r = confirm('This arrangement has a conflict with previous version. Do you want to fork to new arrangement?');
    if (r == true) {
      var newID =  arrangement.arrangement_id + '-conflicted-' + moment().format('YYYY-MM-DD-HH:mm:ss');
      arrangement.db.putIfNotExists({
        _id: newID,
        title: arrangement.doc.title + '-conflict',
        author: arrangement.doc.author,
        buffers: arrangement.doc.buffers,
        tracks: arrangement.doc.tracks,
        timestamp: arrangement.doc.timestamp,
      }).then(function (data) {
        $state.go('editor', {arrangement_id: newID});
      });  
    } else {
      arrangement.delta = {};
    }
  }

  arrangement.syncing = function(doc) {
    arrangement.onlineState = true;
    // alert('sync');
    console.log('SYNCING');
    console.log(doc);

    if (doc.id == arrangement.arrangement_id) {

      function doUpdate(callback) {
        
          console.log('SYNC REV');
          arrangement.doc._rev = doc.doc._rev;
          arrangement.doc.timestamp = doc.doc.timestamp;
          console.log('::DEBUG:: recivedCouch');
          console.log(window.performance.now() + window.performance.timing.navigationStart);

          $rootScope.$apply(function() {
            if (!_.isEmpty(arrangement.queue)) {
              var a = angular.copy(arrangement.doc);
              var b = angular.copy(doc.doc);
              delete a['_rev'];
              delete b['_rev'];
              delete a['temp'];
              delete a['temp'];
              delete a['timestamp'];
              delete b['timestamp'];
              var delta = jsondiffpatch.diff(a, b);
              if (!delta) {
                console.log('CHECK');
                arrangement.temp = false;
                arrangement.doc = doc.doc;
              }
              arrangement.queue = {};
            } else {
              console.log('CHECK');
              arrangement.temp = false;
              arrangement.doc = doc.doc;
            }
            $rootScope.arrangement = arrangement.doc;
            // arrangement.onlineSync = true;
          });
      }

      if (!_.isEmpty(arrangement.delta)) {
        console.log('BEFORE UPDATE: Check Delta');
        console.log(arrangement.delta);
        arrangement.checkOffline().then(function (conflict) {
          if (conflict) {
            arrangement.conflict();
          } else {
            arrangement.delta = {};
          }
          arrangement.onlineSync = true;
        });
      } else if (arrangement.timesock) {
        if (doc.doc.timestamp >= arrangement.timesock) {
          console.log('UPDATE!!!');
          doUpdate();
          arrangement.timesock = null;
        }
      } else {
        doUpdate();
      } 

      $rootScope.$emit('sync');
      $rootScope.$emit('synced');
      $rootScope.$emit('loadWatcher');
    }
  };

  arrangement.goOffline = function() {
    arrangement.offlineState = false;
    arrangement.onlineSync = false;
    arrangement.offlineStamp = _.clone(arrangement.doc.timestamp, true);
    console.log(arrangement.offlineStamp);
  }

  arrangement.push = function() {
    console.log('PUT SENDING');

    var newDoc = arrangement.doc;
    delete newDoc['_rev'];
    delete newDoc['_id'];
    delete newDoc['temp'];
    delete newDoc['timesock'];

    arrangement.db.upsert(arrangement.arrangement_id, function(doc) {
      return newDoc;
    }).then(function(result) {
    }).catch(function(error) {
      console.log('failed to update');
    });
  }

  arrangement.goOnline = function() {
    // arrangement.push();
    arrangement.offlineState = true;
    console.log(arrangement.delta);
  }

  arrangement.sync = function() {
    var opts = {
      live: true, 
      retry: true,
      since: 'now',
      include_docs: true,
      conflicts: true
    };
    arrangement.db.sync(CouchURL + _ArrangementDB, opts);
  }
  
  arrangement.init = function() {
    
    arrangement.db = new PouchDB(_ArrangementDB, {auto_compaction: true});

    // DESTROY
    // arrangement.db.destroy().then(function() {
    //   console.log('DESTRYED');
    // });

    console.log(arrangement.arrangement_id);

    var load = function() {
      console.log('::DEBUG:: init');
      console.log(window.performance.now() + window.performance.timing.navigationStart);
      arrangement.db.get(arrangement.arrangement_id).then(function (doc) {
        console.log('::DEBUG:: loaded');
        console.log(window.performance.now() + window.performance.timing.navigationStart);
        console.log(doc);

        $rootScope.$apply(function() {
          arrangement.doc = doc;
          $rootScope.arrangement = arrangement.doc;
        });

        $rootScope.$emit('sync');
        $rootScope.$emit('synced');
        $rootScope.$emit('loadWatcher');
      }).catch(function(err) {
        console.log(err);
        var newDoc = {
          _id: arrangement.arrangement_id,
          tracks: [],
          buffers: [],
          author: '',
          title: 'Untitled'
        };
        arrangement.db.putIfNotExists(arrangement.arrangement_id, newDoc);
      });
    };

    arrangement.db.replicate.from(CouchURL + _ArrangementDB).then(load).catch(load);

    arrangement.db.changes({
      live: true, 
      retry: true,
      since: 'now',
      include_docs: true,
      conflicts: true
    }).on('change', arrangement.syncing);

    arrangement.sync();
  }

  arrangement.retrieve = function() {
    return arrangement.db.get(arrangement.arrangement_id);
  }

  // SOCKET

  // var socket = io();

  Socket.socket.on('replicate', function (data) {
    console.log('===STREAM COMING===');
    if (data._id == arrangement.arrangement_id && arrangement.onlineState && arrangement.onlineSync) {
      
        console.log('::DEBUG:: recivedSocket');
        console.log(window.performance.now() + window.performance.timing.navigationStart);

        console.log('UPDATE SOCKET');
        jsondiffpatch.patch(arrangement.doc, data.delta);
        arrangement.timesock = data.timesock;
        arrangement.doc.timestamp = data.timesock;

        $rootScope.$apply(function() {
          $rootScope.arrangement = arrangement.doc;  
        });

        $rootScope.$emit('sync');
        $rootScope.$emit('synced');
        $rootScope.$emit('loadWatcher');
      
    }
  });
  // SOCKET

  arrangement.watchComponent = function(newValue, delta) {
    var newDoc = newValue;
    var timesock = newDoc._rev;
    arrangement.queue = delta;

    if (!_.isEmpty(arrangement.delta)) {

      console.log('CHECK DELTA IN REPLICATE');
      arrangement.checkOffline().then(function (conflict) {
        if (conflict) {
          arrangement.conflict();
        } else {
          arrangement.delta = {};
        }
        arrangement.onlineSync = true;
      });

    } else {

      Socket.socket.emit('replicate', {_id: newDoc._id, delta: delta, timesock: timesock}); 
      
      delete newDoc['_rev'];
      delete newDoc['_id'];
      delete newDoc['temp'];
      delete newDoc['timesock'];

      newDoc.timestamp = timesock;
      arrangement.doc.timestamp = timesock;


      console.log('PUT SENDING');
      console.log('::DEBUG:: sendDiff');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      arrangement.db.upsert(arrangement.arrangement_id, function(doc) {
        return newDoc;
      }).then(function(result) {
        
      }).catch(function(error) {
        console.log('failed to update');
      });

    }

  }

  $rootScope.$watch('arrangement', function(newValue, oldValue){
    if (newValue && oldValue) {
      if (newValue._rev == oldValue._rev) {
        var delta = jsondiffpatch.diff(oldValue, newValue);
        if (!arrangement.timesock) {
          arrangement.watchComponent(newValue, delta);
        }
      }
    }
  }, true);

  arrangement.setDelta = function(delta) {
    arrangement.delta = delta;
  }

  return arrangement;
});


