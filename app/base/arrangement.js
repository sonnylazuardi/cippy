app.service('Arrangement', function($rootScope, $q, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http){

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
  var remoteCouch = 'http://localhost:5984/cippy';
  

  var init = function() {
    // console.log('init');
    db.get('2197e37f783d4a9f58793a769b000511').then(function (doc) {
      console.log(doc);
      arrangement.doc = doc;
      $rootScope.arrangement = arrangement.doc;
      $rootScope.$emit('sync');
    });
  }

  var syncing = function(doc) {
    
    // console.log('syncing');
    arrangement.doc = doc.doc;
    $rootScope.arrangement = arrangement.doc;
    $rootScope.$emit('sync');
    
  };

  // Initialise a sync with the remote server
  function sync() {
    var opts = {live: true, retry: true};
    db.replicate.to(remoteCouch, opts, syncError);
    db.replicate.from(remoteCouch, opts, syncError);
  }

  // There was some form or error syncing
  function syncError() {
    console.log('syncError');
  }

  db.changes({
    since: 'now',
    live: true,
    include_docs: true,
    conflicts:true
  }).on('change', syncing);

  if (remoteCouch) {
    init();
    sync();
  }

  $rootScope.$watch('arrangement', function(newValue, oldValue){

    if (newValue && oldValue) {
      if (newValue._rev == oldValue._rev) {

        console.log('changed');

        // console.log(newValue);
        // console.log(oldValue);
        // console.log(arrangement.doc);
        db.put(newValue, {conflicts: true});


      }
    }
  }, true);

  return arrangement;
});

