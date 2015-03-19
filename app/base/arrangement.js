app.service('Arrangement', function($rootScope, $q, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http){

  // DiffSyncClient.initializeOrSync();

  var arrangement = {
    doc: {
      "_id": "2197e37f783d4a9f58793a769b000511",
      "title": "test",
      "owner_id": "2197e37f783d4a9f58793a769b0003a6",
      "shared_with": [],
      "type": "arrangement",
      "gain": 1,
      "buffers": [],
      "tracks": [
          {
              "id": "track_547742374880256640",
              "title": "Untitled",
              "type": "drums",
              "pieces": [
                  {
                      "type": "drum",
                      "drumType": "trap",
                      "position": 0.66,
                      "id": "drums_123349464225170190",
                      "instruments": [
                          "hihat-closed",
                          "bass",
                          "snare"
                      ],
                      "patternOrder": [
                          "a"
                      ],
                      "patterns": {
                          "a": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {
                                  "bass": [
                                      1,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      null,
                                      1,
                                      1,
                                      null,
                                      null,
                                      1
                                  ],
                                  "kick": [
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null
                                  ],
                                  "snare": [
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      1,
                                      1,
                                      1,
                                      null,
                                      null,
                                      1,
                                      1,
                                      null
                                  ],
                                  "hihat-closed": [
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null
                                  ]
                              }
                          },
                          "b": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "c": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "d": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "e": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "f": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          }
                      }
                  },
                  {
                      "type": "drum",
                      "drumType": "regular",
                      "position": 3.48,
                      "id": "drums_208754796336582430",
                      "instruments": [
                          "hihat-closed",
                          "bass",
                          "snare"
                      ],
                      "patternOrder": [
                          "a"
                      ],
                      "patterns": {
                          "a": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {
                                  "bass": [
                                      1,
                                      null,
                                      null,
                                      null,
                                      1,
                                      1,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      1,
                                      null
                                  ],
                                  "kick": [
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      1,
                                      1,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      1
                                  ],
                                  "snare": [
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null
                                  ],
                                  "hihat-closed": [
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      null,
                                      1,
                                      null,
                                      null,
                                      null,
                                      null
                                  ]
                              }
                          },
                          "b": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "c": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "d": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "e": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "f": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          }
                      }
                  },
                  {
                      "type": "drum",
                      "drumType": "trap",
                      "position": 6.44,
                      "id": "drums_1261417298168277500",
                      "instruments": [
                          "hihat-closed",
                          "bass",
                          "snare"
                      ],
                      "patternOrder": [
                          "a"
                      ],
                      "patterns": {
                          "a": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "b": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "c": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "d": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "e": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          },
                          "f": {
                              "slots": 16,
                              "bpm": 100,
                              "beats": {}
                          }
                      }
                  }
              ],
              "gain": 1
          },
          {
              "id": "track_901541790377212500",
              "title": "Untitled",
              "type": "recording",
              "pieces": [],
              "gain": "1"
          }
      ],
      "created_at": 1426568295629
    },

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

  $rootScope.$watch('arrangement', function(){
    // DiffSyncClient.syncWithServer();
  }, true);

  // $rootScope.$on('sync', function(){
  //   $rootScope.$apply(function(){
  //     // arrangement.doc = DiffSyncClient.doc.localCopy;

  //     // set up the watcher
  //     if(!$rootScope.arrangement)
  //       $rootScope.arrangement = arrangement.doc;

  //     $rootScope.$emit('synced');
  //   });
  // });

  return arrangement;
});