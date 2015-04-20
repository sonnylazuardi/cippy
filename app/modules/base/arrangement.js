app.service('Arrangement', function($rootScope, $q, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http, ArrangementID){
  var arrangement_id = ArrangementID;
  var timeInit = 0;
  var timeSend = 0;
  var timeReceive = 0;
  var arrangement = {
    doc: {},

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

    addTrack: function(type){
      var base = {
        id: IDGenerator.generate('track'),
        title: 'Untitled',
        type: type,
        pieces: []
      };

      this.doc.tracks.push(base);
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

  arrangement.context = SharedAudioContext.getContext();
  arrangement.master = arrangement.context.createGain();
  arrangement.compressor = arrangement.context.createDynamicsCompressor();
  arrangement.master.connect(arrangement.compressor);
  arrangement.compressor.connect(arrangement.context.destination);

  var db = new PouchDB('cippy');
  var localCouch = 'http://localhost:5984/cippy';
  var remoteCouch = 'http://kabin.id:5984/cippy';
  // var remoteCouch = 'http://couchdb-9fea86.smileupps.com/cippy';
  
  var init = function() {
    // console.log('init');
    var newDoc = {
      _id: arrangement_id,
      tracks: [],
      buffers: [],
    };
    db.putIfNotExists(arrangement_id, newDoc);

    db.get(arrangement_id).then(function (doc) {
      // console.log(doc);
      arrangement.doc = doc;
      $rootScope.arrangement = arrangement.doc;
      console.log('init');
      console.log(window.performance.now() + window.performance.timing.navigationStart);
      // timeInit = window.performance.now();

      $rootScope.$emit('sync');
      $rootScope.$emit('synced');
    }).catch(function (err) {
      
      console.log('===ERROR===');
      console.log(err);
    });
  }

  var syncing = function(doc) {
    arrangement.doc = doc.doc;

    $rootScope.$apply(function() {
      $rootScope.arrangement = arrangement.doc;  
    });
       
    console.log('receive');
    console.log(window.performance.now() + window.performance.timing.navigationStart);
    // timeReceive = window.performance.now() - timeInit;
    // console.log(timeReceive);

    $rootScope.$emit('sync');
    $rootScope.$emit('synced');
    $rootScope.$emit('loadWatcher');
  };

  // Initialise a sync with the remote server
  function sync() {
    var opts = {live: true, retry: true};
    db.sync(remoteCouch, opts);
    // db.replicate.to(remoteCouch, opts, syncError);
    // db.replicate.from(remoteCouch, opts, syncError);
    // Uncomment for local couch
    // db.replicate.to(localCouch, opts, syncError);
    // db.replicate.from(localCouch, opts, syncError);
  }

  // There was some form or error syncing
  function syncError() {
    // console.log('syncError');
  }

  // arrangement.doc = JSON.parse(test);
  // $rootScope.arrangement = arrangement.doc;
  // $rootScope.$emit('sync');
  db.changes({
    since: 'now',
    live: true,
    include_docs: true,
    conflicts: true,
  }).on('change', syncing);

  if (remoteCouch) {
    init();
    sync();
  }

  var watchComponent = function(newValue) {
    var newDoc = newValue;
    console.log('send');
    console.log(window.performance.now() + window.performance.timing.navigationStart);
    // timeSend = window.performance.now() - timeInit;
    // console.log(timeSend);

    db.put(newDoc, {conflicts: true}).then(function(result) {
      // console.log(result);
    }).catch(function(err) {
      console.log(err);
    });
  }

  $rootScope.$watch('arrangement', function(newValue, oldValue){
    // console.log('CHANGE HAPPEN');
    if (newValue && oldValue) {
      if (newValue._rev == oldValue._rev) {
          watchComponent(newValue);
      }
    }
  }, true);

  return arrangement;
});

