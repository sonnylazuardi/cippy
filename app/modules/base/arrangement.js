
app.service('Arrangement', function($rootScope, $q, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http, CouchURL, _ArrangementDB, $interval){
  var self = this;
  var timeInit = 0;
  var timeSend = 0;
  var timeReceive = 0;
  self.stackCounter = 0;
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
  arrangement.db = {}

  arrangement.syncing = function(doc) {
    // alert('sync');
    // console.log(doc);
    if (doc.id == arrangement.arrangement_id) {

      arrangement.doc._rev = doc.doc._rev;
      if (self.stackCounter > 0) {
        self.stackCounter--;
      }

      if (self.stackCounter == 0) {
        arrangement.temp = false;
        arrangement.doc = doc.doc;
        $rootScope.$apply(function() {
          $rootScope.arrangement = arrangement.doc;  
        });
      }

      // console.log(self.stackCounter);
         
      // console.log('sync-receive');
      // console.log(window.performance.now() + window.performance.timing.navigationStart);

      $rootScope.$emit('sync');
      $rootScope.$emit('synced');
      $rootScope.$emit('loadWatcher');
    }
  };
  
  arrangement.init = function() {
    // var newDoc = {
    //   _id: arrangement.arrangement_id,
    //   tracks: [],
    //   buffers: [],
    // };
    // db.putIfNotExists(arrangement.arrangement_id, newDoc);
    arrangement.db = new PouchDB(_ArrangementDB);
    console.log('init1');
    console.log(window.performance.now());

    arrangement.db.get(arrangement.arrangement_id).then(function (doc) {
      console.log('init2');
      console.log(window.performance.now());

      arrangement.doc = doc;
      $rootScope.arrangement = arrangement.doc;

      $rootScope.$emit('sync');
      $rootScope.$emit('synced');
    });

    arrangement.db.changes({
      since: 'now',
      live: true,
      include_docs: true,
      conflicts: true,
    }).on('change', arrangement.syncing);

    var opts = {live: true, retry: true};
    arrangement.db.sync(CouchURL + _ArrangementDB, opts);
  }

  // SOCKET

  var socket = io();

  socket.on('replicate', function (data) {
    // console.log('===STREAM COMING===');
    // console.log('receive');
    // console.log(window.performance.now() + window.performance.timing.navigationStart);
    // console.log(data);
    if (data._id == arrangement.arrangement_id) {
      // data.temp = true;
      // arrangement.doc = data;
      // console.log(data.delta);
      jsondiffpatch.patch(arrangement.doc, data.delta);
      // console.log(arrangement.doc);
      arrangement.doc.temp = true;
      // console.log('nambah2');
      self.stackCounter++;

      $rootScope.$apply(function() {
        $rootScope.arrangement = arrangement.doc;  
      });

      $rootScope.$emit('sync');
      $rootScope.$emit('synced');
      $rootScope.$emit('loadWatcher');
    }
  });

  // SOCKET

  var watchComponent = function(newValue, delta) {
    var newDoc = newValue;
    // console.log(self.stackCounter);
    // if (self.stackCounter == 0) {
    //   newDoc.temp = false;
    // }

    if (!newDoc.temp) {
      // console.log('send');
      // console.log(window.performance.now() + window.performance.timing.navigationStart);
      
      self.stackCounter++;
      // console.log('nambah1');
      
      // newDoc.temp = true;

      socket.emit('replicate', {_id: newDoc._id, delta: delta}); 
      
      delete newDoc['_rev'];
      delete newDoc['_id'];
      delete newDoc['temp'];

      arrangement.db.upsert(arrangement.arrangement_id, function(doc) {
        return newDoc;
      }).then(function(result) {
        if (self.stackCounter > 0)
          self.stackCounter--;
      }).catch(function(error) {
        console.log('failed to update');
      });

    }
  }

  $rootScope.$watch('arrangement', function(newValue, oldValue){
    if (newValue && oldValue) {
      if (newValue._rev == oldValue._rev) {
        var delta = jsondiffpatch.diff(oldValue, newValue);
        watchComponent(newValue, delta);
      }
    }
  }, true);

  return arrangement;
});


