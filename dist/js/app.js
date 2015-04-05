var app = angular.module('cippy', ['partials', 'ngSanitize']); 
app.service('Arrangement', function($rootScope, $q, IDGenerator, BufferUploader, $timeout, SharedAudioContext, $http){
  var arrangement = {
    doc: {
      tracks: []
    },

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
  
  var init = function() {
    // console.log('init');
    db.get('coba-1').then(function (doc) {
      // console.log(doc);
      arrangement.doc = doc;
      $rootScope.arrangement = arrangement.doc;
      $rootScope.$emit('sync');
    });
  }

  var syncing = function(doc) {
    arrangement.doc = doc.doc;

    $rootScope.$apply(function() {
      $rootScope.arrangement = arrangement.doc;  
    });
        
    $rootScope.$emit('sync');
    $rootScope.$emit('loadWatcher');
  };

  // Initialise a sync with the remote server
  function sync() {
    var opts = {live: true, retry: true};
    db.replicate.to(remoteCouch, opts, syncError);
    db.replicate.from(remoteCouch, opts, syncError);
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

  db.putIfNotExists('coba-1', {
    _id: 'coba-1',
    tracks: []
  });

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


app.directive('contenteditable', function(){
  return {
    require: 'ngModel',
    link: function(scope, element, attributes, controller) {
      element.bind('keydown', function(event){
        // ENTER
        if(event.keyCode === 13){
          element[0].blur();
        }
      })

      // read and save the value when the element blurs
      element.bind('blur', function() {
        scope.$apply(function() {
          controller.$setViewValue(element.text().replace(/(\r\n|\n|\r)/gm, ""));
        });
      });
    }
  };
});
/**
 * Loads a doc from the server and takes care of updating it via differntial synchronization
 */
app.factory('DiffSyncClient', ['$rootScope', 'jsondiffpatch', 'utils', function($rootScope, jsondiffpatch, utils){
  var client = {
    socket: null,
    syncing: false,
    initialized: false,
    scheduled: false,
    doc: {
      localVersion: 0,
      serverVersion: 0,
      shadow: {},
      localCopy: {},
      edits: []
    },
    commands: {
      syncWithServer: 'send-edit',
      getInitialVersion: 'get-latest-document-version',
      remoteUpdateIncoming: 'updated-doc'
    },

    initializeOrSync: function(){
      if(this.isInitialized()){
        window.location.reload();
      }else if(this._id){
        this.getInitialVersion();
      }
    },

    /**
     * Has a sync been scheduled?
     * @return {Boolean}
     */
    isScheduled: function(){
      return this.scheduled === true;
    },

    /**
     * Is client currently syncing?
     * @return {Boolean}
     */
    isSyncing: function(){
      return this.syncing === true;
    },

    /**
     * Has the client been initialized?
     * @return {Boolean}
     */
    isInitialized: function(){
      return this.initialized === true;
    },

    getInitialVersion: function(){
      if(this._id === undefined) throw(new Error('An `id` needs to be specified when syncing a model!'));
      if(this.isSyncing()) return false;
      this.syncing = true;

      this.socket.emit(this.commands.getInitialVersion, this._id, this._setUpLocalVersion.bind(this));
    },

    _setUpLocalVersion: function(latestVersion){
      this.syncing = false;
      this.doc.localCopy = utils.deepCopy(latestVersion.doc);
      this.doc.shadow = utils.deepCopy(latestVersion.doc);
      this.doc.serverVersion = latestVersion.version;
      this.initialized = true;
      $rootScope.$emit('sync');

      // listen to incoming updates from the server
      this.socket.on(this.commands.remoteUpdateIncoming, this.syncWithServer.bind(this));

      // listen to errors and reload
      this.socket.on('error', function(message){
        window.location.reload();
      });
    },

    syncWithServer: function(){
      if(this.isSyncing() || !this.isInitialized()){ return false; }
      this.syncing = true;

      // 1) create a diff of local copy and shadow
      var diff = this.createDiff(utils.deepCopy(this.doc.shadow), utils.deepCopy(this.doc.localCopy));
      var basedOnLocalVersion = this.doc.localVersion;

      // 2) add the difference to the local edits stack if the diff is not empty
      if(!_.isEmpty(diff))
        this.addEdit(diff, basedOnLocalVersion);

      // 3) create an edit message with all relevant version numbers
      var editMessage = this.createEditMessage(basedOnLocalVersion);

      // 4) apply the patch to the local shadow
      this.applyPatchTo(this.doc.shadow, diff);

      // 5) send the edits to the server
      this.sendEdits(editMessage);

      // yes, we're syncing
      return true;
    },

    /**
     * Creates a diff from specified documents
     * @return {Diff}
     */
    createDiff: function(docA, docB){
      return jsondiffpatch.diff(docA, docB);
    },

    /**
     * Applies a given patch (diff) to the given document
     * @param  {Doc} doc the doc that will get patched
     * @param  {Diff} patch the patch
     */
    applyPatchTo: function(doc, patch){
      jsondiffpatch.patch(doc, patch);
    },

    /**
     * Adds an edit to the local edits stack
     */
    addEdit: function(diff, baseVersion){
      this.doc.edits.push({
        serverVersion: this.doc.serverVersion,
        localVersion: baseVersion,
        diff: diff
      });
      // update the local version number
      this.doc.localVersion++;
    },

    createEditMessage: function(baseVersion){
      return {
        id: this.doc.localCopy._id,
        edits: this.doc.edits,
        localVersion: baseVersion,
        serverVersion: this.doc.serverVersion
      }
    },

    /**
     * Sends the edit to the server and processes the server edits
     * @param  {Object} editMessage
     */
    sendEdits: function(editMessage){
      this.socket.emit(this.commands.syncWithServer, editMessage, function(serverEdits){
        this.applyServerEdits(serverEdits);
      }.bind(this));
    },

    applyServerEdits: function(serverEdits){
      if(serverEdits && serverEdits.localVersion == this.doc.localVersion){
        // 0) delete all previous edits
        this.doc.edits = [];
        // 1) iterate over all edits
        serverEdits.edits.forEach(this.applyServerEdit.bind(this));
      }else{
        console.log('rejected patch because localVersions don\'t match');
      }

      this.syncing = false;
      this.scheduled = false;
    },

    applyServerEdit: function(edit){
      // 2) check the version numbers
      if(edit.localVersion == this.doc.localVersion &&
        edit.serverVersion == this.doc.serverVersion){

        // versions match
        // 3) patch the shadow
        this.applyPatchTo(this.doc.shadow, edit.diff);

        // 3) increase the version number for the shadow if diff not empty
        if(!_.isEmpty(edit.diff))
          this.doc.serverVersion++;
        // apply the patch to the local document
        // IMPORTANT: Use a copy of the diff, or newly created objects will be copied by reference!
        this.applyPatchTo(this.doc.localCopy, utils.deepCopy(edit.diff));

        // trigger a generic sync event
        $rootScope.$emit('sync');
      }else{
        console.log('patch from server rejected, due to not matching version numbers');
      }
    },

    /**
     * Schedules a server-sync
     */
    scheduleSync: function(){
      if(this.isScheduled()) return;

      this.scheduled == true;

      this.syncWithServer();
    }

  };

  client.socket = io.connect();
  client.socket.on('connect', client.initializeOrSync.bind(client));

  client.syncWithServer = _.debounce(client.syncWithServer.bind(client), 50);

  // make sure that clients sync at least every 5 seconds
  setInterval(client.scheduleSync.bind(client), 5000);

  window.client = client;
  return client;
}]);
app.directive('draggableEditorElement', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr){

      var dragStart = function(event){
        // only allow left clicks
        if(event.which != 1) return

        angular.element(document).one('mouseup', dragend);
        angular.element(document).bind('mousemove', drag);

        scope.lastX = scope.startX = event.x;
        scope.lastY = scope.startY = event.y;

        element.triggerHandler('drag-start');
      };

      var drag = function(event){
        event.preventDefault();
        event.stopPropagation();

        scope.currentX = event.x;
        var xDiff = scope.currentX - scope.lastX;
        scope.currentY = event.y;
        var yDiff = scope.currentY - scope.lastY;

        // Somehow the last drag event has weird numbers and causes glitches
        // By disallowing a max drag diff, we can prevent the glitches
        // if(Math.abs(xDiff) < 200){
          scope.lastX = scope.currentX;
          scope.dragXDiff = scope.currentX - scope.startX;
          scope.lastY = scope.currentY;
          scope.dragYDiff = scope.currentY - scope.startY;

          element.triggerHandler('drag', [xDiff, yDiff]);
        // }

        return false;
      };

      var dragend = function(event){
        event.stopPropagation();
        event.preventDefault();

        element.triggerHandler('drag-end');

        angular.element(document).unbind('mousemove', drag);

        return false;
      };

      element.bind('mousedown', dragStart);
    }
  }
});
app.service('Drumkits', ['BufferLoader', 'SharedAudioContext', '$rootScope', function(BufferLoader, SharedAudioContext, $rootScope){

  var buffers = {};
  var sources = [];
  var context = SharedAudioContext.getContext();

  var cleanupSourceNodes = function(){
    sources.forEach(function(source){
      try{
        source.disconnect();
        source.stop();
      }catch(e){
        console.log(e);
      }
    });
    sources = [];
  };

  $rootScope.$on('stop', cleanupSourceNodes);
  $rootScope.$on('force-stop', cleanupSourceNodes);

  return {
    loadKit: function(kitName){
      return BufferLoader.load(this.kits[kitName]).then(function(buffer){
        buffers[kitName] = buffer;
      });
    },

    getKit: function(kitName){
      return buffers[kitName];
    },

    noop: function(){
      return { stop: function(){} };
    },

    play: function(kitName, instrument, master, when, offset, forcedTime){
      if(!when){ when = 0; } // start immediately if not defined
      if(!offset){ offset = 0; } // no offset by default

      var source = context.createBufferSource();
      var kit = this.getKit(kitName);
      if(!kit) return this.noop();

      source.buffer = kit;
      source.connect(master);

      var offsets = this.kits[kitName].instruments[instrument];
      if(!offsets) return this.noop();
      var duration = offsets[1] - offsets[0];

      when = (forcedTime != undefined) ? forcedTime : (context.currentTime + when);

      // start at defined point, with defined offset, for calculated duration
      source.start(when, offsets[0], duration);

      // add source node to reference dump
      sources.push(source)

      return source;
    },

    instrumentsForKit: function(kitName){
      return Object.keys(this.kits[kitName].instruments);
    },

    kits: {
      regular: {
        location: 'dist/sounds/drumkits/regular.wav',
        instruments: {
          bass: [0, 0.522],
          kick: [0.546, 1.173],
          snare: [1.194, 1.540],
          "hihat-open": [1.555, 2.443],
          "hihat-closed": [2.475, 2.594]
        }
      },
      trap: {
        location: 'dist/sounds/drumkits/trap.wav',
        instruments: {
          bass: [0, 0.626],
          kick: [0.641, 1.006],
          snare: [1.020, 1.365],
          "hihat-closed": [1.380, 1.535]
        }
      }
    }
  }
}]);
app.directive('frequencySpectrum', ['$rootScope', '$compile',
  function($rootScope, $compile) {

  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      var context = element[0].getContext('2d');
      var width = element[0].width;
      var height = element[0].height;
      var max = 128;

      var draw = function(){
        if(!scope.analyser) return;

        var waveData = new Uint8Array(scope.analyser.frequencyBinCount);
        var stepSize = Math.ceil(scope.analyser.frequencyBinCount / width);

        scope.analyser.smoothingTimeConstant = .7;
        scope.analyser.getByteFrequencyData(waveData);

        context.clearRect(0, 0, width, height);

        for(var i = 0; i < width; i++){
          var value = 0;
          var sum = 0;
          for(var j = 0; j < stepSize; j++){
            sum += waveData[i * stepSize + j];
          }
          value = sum / stepSize;
          var barHeight = (value / max) * (height / 2);
          context.fillRect(i, height - barHeight, 1, height - (height - barHeight));
        }

        if(scope.analyser)
          requestAnimationFrame(draw);
      };

      draw();

      // draw when there is an analyser
      scope.$watch('analyser', draw);
    }
  }
}]);
app.factory('jsondiffpatch', [function(){
  jsondiffpatch.config.objectHash = function(obj) { return obj.id || JSON.stringify(obj); };
  return jsondiffpatch;
}]);
app.factory('Ticker', ['$rootScope', function($rootScope){
  var Ticker = function(){
    this.interval = 100;
    this.running = false;
    this.callback = function(){};
  };

  /**
   * Is the Ticker running?
   * @return {Boolean}
   */
  Ticker.prototype.isRunning = function(){ return this.running === true; };

  /**
   * Start the ticking!
   */
  Ticker.prototype.start = function(){
    if(this.isRunning()) return;

    var tick = function(){ this.callback(); }.bind(this);
    this.intervalHandle = setInterval(tick, this.interval);
    this.running = true;
    tick();
  };

  /**
   * Stop the ticking
   */
  Ticker.prototype.stop = function(){
    if(!this.isRunning()) return;

    clearInterval(this.intervalHandle);

    this.intervalHandle = undefined;
    this.running = false;
  };

  return Ticker;
}]);
app.directive('waveForm', ['$rootScope', '$compile', 'EditorConfig',
  function($rootScope, $compile, EditorConfig) {

  var renderWaveForm = function(node, canvas, options){
    var pixelsPerSecond = EditorConfig.pixelsPerSecond;
    var height = 80;
    var width = node.length() * pixelsPerSecond;
    var channelData = node.buffer.getChannelData(0);
    var length = channelData.length;
    var stepSize = Math.ceil(length / width);

    var skipSteps = 0;

    // recalculate steps and skips when there are offsets
    if(options.ignoreOffsets){
      // the width should be the original width
      width = node.buffer.duration * pixelsPerSecond;
      // recalculate the stepSize, because width might have changed
      stepSize = Math.ceil(length / width);
    }else{
      if(node.data.offsetStart || node.data.offsetEnd){
        // calculate the offsets into the channel's coordination system
        var offsetLength = ((node.data.offsetStart + node.data.offsetEnd) * node.context.sampleRate);
        var offsetStartLength = (node.data.offsetStart * node.context.sampleRate);
        // take the offsetLength from the cahnnel length to recalculate the stepSize
        stepSize = Math.ceil((channelData.length - offsetLength) / width);
        // calculate the amount of steps to skip from the offsetStartLength
        skipSteps = Math.floor(offsetStartLength / stepSize);
      }
    }

    var heigtOffset = height / 2;
    var canvasContext = canvas[0].getContext('2d');

    // setup the canvas size
    canvas.prop('width', width);
    canvas.prop('height', height);
    // clear the canvas
    canvasContext.clearRect(0, 0, width, height);

    var min, max, currentValue;
    for(var i = 0; i < width; i++){
      min = 1; max = -1;

      // determine min and max for current section
      for(var j = 0; j < stepSize; j++){
        currentValue = channelData[(i + skipSteps) * stepSize + j];
        min = currentValue < min ? currentValue : min;
        max = currentValue > max ? currentValue : max;
      }

      // draw a rectangle from min to max, centered vertically
      if(currentValue)
        canvasContext.fillRect(i, (1 + min) * heigtOffset, 1, (max - min) * heigtOffset);
    }
  };

  return {
    restrict: 'A',
    link: function(scope, element, attributes){
      var options = {
        ignoreOffsets: (attributes.ignoreoffsets != undefined)
      };

      var render = function(){
        renderWaveForm(scope.node, element, options);
        scope.$emit('waveform:rendered');
      };

      var unwatchPixels, unwatchOffsetStart, unwatchOffsetEnd;

      var fetchNode = function(){
        if(!scope.node) return;

        scope.node.fetch().then(function(){
          render();
          unwatchPixels = scope.$watch('config.pixelsPerSecond', function(newv, oldv){
            if(newv != oldv) render();
          });

          unwatchOffsetStart = scope.$watch('piece.offsetStart', function(newv, oldv){
            if(newv != oldv) render();
          });

          unwatchOffsetEnd = scope.$watch('piece.offsetEnd', function(newv, oldv){
            if(newv != oldv) render();
          })
        });  
      };
      
      fetchNode();

      var unwatchNode = scope.$watch('node', function(newv, oldv){
        if(newv != oldv) fetchNode();
      });

      element.on('$destroy', function(){
        unwatchNode();
        if(unwatchPixels) unwatchPixels();
        if(unwatchOffsetStart) unwatchOffsetStart();
        if(unwatchOffsetEnd) unwatchOffsetEnd();
      });
    }
  }
}]);
app.service('EditorConfig', function(){
  return {
    pixelsPerSecond: 50,
    track_settings_offset: 190
  }
});
app.controller('EditorController', function($rootScope, $scope, Arrangement, EditorConfig, Sampler, BufferedNode){

    $scope.arrangement = Arrangement.doc;
    $scope.config = EditorConfig;

    $rootScope.$on('sync', function(){
      $scope.$apply(function(){
        $scope.arrangement = Arrangement.doc;
        // $rootScope.arrangement = Arrangement.doc;
        // console.log($rootScope.arrangement);
        // console.log($scope.arrangement);
      });
    });

});
app.controller('EditorControlsController', function($rootScope, $scope, Scheduler, Arrangement){

  $rootScope.showCommunicationPanel = false;
  $scope.playing = false;
  $scope.arrangement = Arrangement.doc;
  $scope.gain = 1;

  $scope.isPlaying = function(){
    return ($scope.playing ? 'icon-pause' : 'icon-play');
  };

  $scope.playPause = function(){
    if($scope.playing)
      this.pause();
    else
      this.play();
  };

  $scope.play = function(){
    $scope.playing = true;
    Scheduler.start();
  };

  $scope.pause = function(){
    $scope.playing = false;
    Scheduler.pause();
  };

  $scope.stop = function(){
    $scope.playing = false;
    $rootScope.$emit('stop');
    Scheduler.stop();
  };

  $scope.addTrack = function(type){
    $scope.showMenu = false;
    Arrangement.addTrack(type);
  };

  $scope.showFiles = function(){
    // FileBrowser.show();
  };

  $scope.hideFiles = function(){
    // FileBrowser.hide();
  };

  $scope.isFileBrowserVisible = function(){
    // return FileBrowser.isVisible();
  };

  $scope.showCommunication = function(){
    $rootScope.showCommunicationPanel = true;
  };

  $scope.isCommunicationPanelVisible = function(){
    return $rootScope.showCommunicationPanel === true;
  };

  // update the gain in the audio node when it changes
  $scope.$watch('gain',function(){
    Arrangement.master.gain.value = $scope.gain;
  });

  // unschedule piece by request
  $rootScope.$on('force-stop', function(event){
    $scope.stop();
  });

});
app.directive('editorControls', function($templateCache) {
  return {
    restrict: 'E',
    templateUrl: 'partials/editor/controls.html',
    controller: 'EditorControlsController'
  }

});
app.directive('editorTracks', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/editor/tracks.html'
  }
});
app.controller('EditorTrackController', ['$rootScope', '$scope', 'Track', 'Arrangement', 'IDGenerator',
  function($rootScope, $scope, Track, Arrangement, IDGenerator){
    $scope.trackNode = new Track($scope.track);
    $scope.muted = false;
    $scope.solo = false;

    // update the gain in the audio node when it changes
    $scope.$watch('track.gain', function(newValue, oldValue){
      $scope.trackNode.in.gain.value = parseFloat(newValue, 10);
    });

    // mute track when another track has been soloed
    $rootScope.$on('soloed-track', function(event, sendingScope){
      // if I sent the broadcast, don't handle it
      if(sendingScope == $scope) return;
      $scope.solo = false;
      $scope.trackNode.in.gain.value = 0;
    });

    // unmute track
    $rootScope.$on('un-soloed-track', function(){
      // dont unmute if muting was set specifically
      if($scope.muted) return;
      $scope.trackNode.in.gain.value = $scope.track.gain;
    });

    $scope.toggleMute = function(){
      if($scope.muted)
        $scope.unMuteTrack();
      else
        $scope.muteTrack();
    };

    $scope.unMuteTrack = function(){
      $scope.muted = false;
      $scope.trackNode.in.gain.value = $scope.track.gain;
    };

    $scope.muteTrack = function(){
      $scope.muted = true;
      $scope.solo = false;
      $scope.trackNode.in.gain.value = 0;
    };

    $scope.toggleSolo = function(){
      if($scope.solo)
        $scope.unSoloTrack()
      else
        $scope.soloTrack()
    };

    $scope.soloTrack = function(){
      $scope.solo = true;
      $scope.unMuteTrack();
      $rootScope.$broadcast('soloed-track', $scope);
    };

    $scope.unSoloTrack = function(){
      $scope.solo = false;
      $rootScope.$broadcast('un-soloed-track', $scope);
    };

    $scope.uploadFile = function(file, position){
      Arrangement.uploadBufferAndAddToTrack(file, $scope.track.id, position);
    };

    $scope.addBuffer = function(bufferId, position){
      Arrangement.addBufferToTrack(bufferId, $scope.track.id, position);
    };

    $scope.addPiece = function(event){
      switch($scope.track.type){
        case 'synthesizer':
          $scope.track.pieces.push({
            "type": "synthesizer",
            "position": 0,
            "id": IDGenerator.generate('synthesizer'),
            "tones": [],
            "synthSettings": {
              "osc1": {
                "type": "square",
                "gain": 1,
                "detune": 0
              },
              "osc2": {
                "type": "sine",
                "gain": 1,
                "detune": 0
              },
              "osc3": {
                "type": "triangle",
                "gain": .5,
                "detune": 0
              },
              "lfo":{
                "type": "sine",
                "frequency": 0
              },
              "toneEnvelope": {
                "attack": 0,
                "decay": 0,
                "sustain": 1,
                "release": 0,
                "boost": 0
              },
              "filter": {
                "frequency": 0,
                "Q": 0,
                "gain": 1,
                "detune": 0,
                "type": "lowpass",
                "activate": false
              }
            }
          });
          break;
        case 'drums': 
          $scope.track.pieces.push({
            "type": "drum",
            "drumType": "trap",
            "position": 0,
            "id": IDGenerator.generate('drums'),
            "instruments": ["hihat-closed","bass","snare"],
            "patternOrder": ['a'],
            "patterns": {
              a: { 'slots': 16, 'bpm': 100,'beats': {} },
              b: { 'slots': 16, 'bpm': 100,'beats': {} },
              c: { 'slots': 16, 'bpm': 100,'beats': {} },
              d: { 'slots': 16, 'bpm': 100,'beats': {} },
              e: { 'slots': 16, 'bpm': 100,'beats': {} },
              f: { 'slots': 16, 'bpm': 100,'beats': {} }
            }
          })
          break;
        case 'recording':
          $scope.addAdditionalContent('<div recording-element ng-model="track"></div>', $scope);
          break;
      }
    };

    $scope.addRecordingElement = function(){
      $scope.addAdditionalContent('<div recording-element ng-model="track"></div>', $scope);
    };

    $scope.removeTrack = function(){
      if(confirm("Do you really want to remove this track? (" + $scope.track.title + ")")){
        var index = $scope.arrangement.tracks.indexOf($scope.track);
        if(index > -1){
          $scope.arrangement.tracks.splice(index, 1);
        }
      }
    };
}]);
app.directive('editorTrack', ['$rootScope', '$compile', 'EditorConfig', 'Arrangement',
  function($rootScope, $compile, EditorConfig, Arrangement) {

  return {
    restrict: 'E',
    controller: 'EditorTrackController',
    templateUrl: 'partials/editor/track.html',
    link: function(scope, element, attrs){
      var trackElement = element[0].querySelector('.track');

      trackElement.addEventListener('dragenter', function(event){
        trackElement.classList.add('drop-here')
        event.preventDefault()
        event.stopPropagation();
        return false;
      });

      trackElement.addEventListener('dragover', function(event){
        trackElement.classList.add('drop-here')
        event.preventDefault()
        event.stopPropagation();
        return false;
      });

      trackElement.addEventListener('dragleave', function(event){
        trackElement.classList.remove('drop-here');
        event.preventDefault()
        event.stopPropagation();
        return false;
      });

      trackElement.addEventListener('drop', function(event){
        trackElement.classList.remove('drop-here');

        // calculate the current position in the track from the drop event
        var position = (event.x - EditorConfig.track_settings_offset) / EditorConfig.pixelsPerSecond;

        var bufferId = event.dataTransfer.getData('buffer_id');

        // if a bufferId has been set, we don't need to upload
        if(bufferId){
          scope.addBuffer(bufferId, position);
        }else{
          // upload the dropped files
          scope.uploadFile(event.dataTransfer.files.item(0), position);
        }

        event.preventDefault();
        event.stopPropagation();
        return false;
      });

      var getAdditionalContentElement = function(){
        return angular.element(
          document.getElementById('additional-content-' + scope.track.id)
        );
      };

      // compile and render a directive into the additional content div (e.g. a recording view)
      scope.addAdditionalContent = function(directiveHTML, theScope){
        var newElement = $compile(directiveHTML)(theScope);
        var container = scope.removeAdditionalContent();
        var additionalContentControls =
          '<div class="additional-content-controls"><button class="topcoat-button" ng-click="removeAdditionalContent()">close</button></div>';
        var additionalContentControls = $compile(additionalContentControls)(theScope);
        container.append(newElement);
        container.append(additionalContentControls);
      };

      // remove the additional content from the view (e.g. a recording view)
      scope.removeAdditionalContent = function(){
        var addContent = getAdditionalContentElement();
        addContent.html('');
        return addContent;
      };
    }
  }
}]);
app.directive('progressLine', function($rootScope, Scheduler, EditorConfig, Arrangement) {

  var setToCurrentPosition = function(el){
    var startPosition = Scheduler.songPosition * EditorConfig.pixelsPerSecond + EditorConfig.track_settings_offset;
    el.removeClass('animated').css('transitionDuration', '0s');
    _.defer(function(){
      el.css('left', startPosition + 'px');
    });
  };

  var startAnimating = function(el){
    var endPosition = 0;
    
    // select the end position from the most right piece in the DOM
    var pieces = document.querySelectorAll('.piece');
    for(var i = 0; i < pieces.length; i++){
      var pieceElement = pieces[i];
      var rect = pieceElement.getBoundingClientRect();
      var $currentRight = rect.left + rect.width;
      endPosition = $currentRight > endPosition ? $currentRight : endPosition;
    };

    var duration = Arrangement.length() - Scheduler.songPosition;

    setToCurrentPosition(el);
    _.defer(function(){
      el.addClass('animated').removeClass('notAnimated').css({
        transitionDuration: duration + 's',
        left: endPosition + 'px'
      }).one('transitionend', function(){
        el.removeClass('animated').addClass('notAnimated');
      });
    });
  };

  var stopAnimating = function(el){
    setToCurrentPosition(el);
  };

  return {
    restrict: 'E',
    template: '<div id="progress-line"></div>',
    link: function(scope, element, attr){
      var progressLine = angular.element(document.getElementById('progress-line'));
      setToCurrentPosition(progressLine);

      $rootScope.$on('player:play', function(){ startAnimating(progressLine); });
      $rootScope.$on('player:pause', function(){ stopAnimating(progressLine); });
      $rootScope.$on('player:stop', function(){ stopAnimating(progressLine); });
      $rootScope.$on('player:position-change', function(){ stopAnimating(progressLine); });

      scope.$watch('config.pixelsPerSecond', function(){ setToCurrentPosition(progressLine); });
    }
  }
});
app.service('Scheduler', ['$rootScope', 'Ticker', 'Arrangement', function($rootScope, Ticker, Arrangement){

  var scheduler = {
    /**
     * Is the scheduler playing the song?
     * @type {Boolean}
     */
    playing: false,

    /**
     * When has it been started the last time
     * @type {Number}
     */
    startedAt: null,

    /**
     * When has it been stopped the last time
     * @type {Number}
     */
    stoppedAt: null,

    /**
     * From which offset should the seon be played?
     * @type {Number}
     */
    from: 0,

    /**
     * The current position in the song
     * @type {Number}
     */
    songPosition: 0,

    /**
     * Look-up table for scheduled pieces
     * @type {Object}
     */
    _scheduledPieces: {},

    start: function(from){
      this.playing = true;
      from = from || this.songPosition;
      this.startedAt = Date.now();
      this.from = from;

      this.schedule();
      this.ticker.start();
      $rootScope.$emit('player:play');
    },

    pause: function(preventEmit){
      this.playing = false;
      this.stoppedAt = Date.now();
      this.songPosition += this.lastDuration();
      this.ticker.stop();
      this.unschedulePieces();
      if(!preventEmit)
        $rootScope.$emit('player:pause');
    },

    stop: function(preventEmit){
      this.playing = false;
      this.pause(true);
      this.songPosition = 0;
      if(!preventEmit)
        $rootScope.$emit('player:stop');
    },

    setSongPosition: function(songPos){
      var continueSong = this.playing;
      console.log('songPosition', this.songPosition)
      this.stop(true);
      this.songPosition = songPos;
      $rootScope.$emit('player:position-change');
      if(continueSong)
        this.start();
    },

    lastDuration: function(){
      return (this.stoppedAt - this.startedAt) / 1000;
    },

    _delta: function(){
      return (Date.now() - this.startedAt) / 1000;
    },

    _position: function(){
      return this._delta() + this.from;
    },

    /**
     * Checks if new pieces need to be scheduled
     */
    schedule: function(){
      var position = this._position();
      var lookAhead = this.lookAhead;
      var piecePosition = 0;
      var pieceLength = 0;
      var pieceInLookahead = false;
      var pieceInBetween = false;

      // find and schedule the next pieces
      Arrangement.doc.tracks.forEach(function(track){
        // only schedule if track contains pieces
        if(!track.pieces || track.pieces.length == 0) return;

        track.pieces.forEach(function(piece){
          piecePosition = piece.position;
          // check if piece is in boundaries
          // piece shouldn't be playing already
          pieceInLookahead = position < piecePosition && position + lookAhead >= piecePosition;
          pieceInBetween = position >= piecePosition && position < piecePosition + this.lengthForPiece(piece);

          // if the current piece is in the lookAhead frame or if the current position lays in it
          // and the piece has not been scheduled yet, then go on and schedule it
          if((pieceInLookahead || pieceInBetween) && !this.hasBeenScheduled(piece)){
            // do we need to delay the start? 
            var whenToStartPiece = Math.max(piecePosition - position, 0);
            // is there an offset for the piece?
            var offset = Math.max(position - piecePosition, 0);

            this.schedulePiece(piece, whenToStartPiece, offset);
          }
        }.bind(this));
      }.bind(this));
    },

    schedulePiece: function(piece, whenToStartPiece, offset){
      var piece = Arrangement.getPiece(piece.id);
      piece.play(whenToStartPiece, offset);
      this._scheduledPieces[piece.data.id] = piece;
      console.log('schedule:piece:' + piece.data.id, whenToStartPiece, offset);
    },

    unschedulePieces: function(){
      Object.keys(this._scheduledPieces).forEach(function(key){
        if(this._scheduledPieces[key] && this._scheduledPieces[key].stop)
          this._scheduledPieces[key].stop();
      }.bind(this));
      this._scheduledPieces = {};
    },

    hasBeenScheduled: function(piece){
      return this._scheduledPieces[piece.id];
    },

    lengthForPiece: function(piece){
      var piece = Arrangement.getPiece(piece.id);
      if(piece)
        return piece.length();
      else
        return 0;
    }
  };

  // setup the ticker which will be used by the scheduler
  var ticker = new Ticker();
  ticker.callback = scheduler.schedule.bind(scheduler);
  scheduler.ticker = ticker;

  // setup the lookahead time (needs to be converted to seconds)
  scheduler.lookAhead = (3 * ticker.interval) / 1000;

  // unschedule piece by request
  $rootScope.$on('unschedule', function(event, piece){
    scheduler._scheduledPieces[piece.id] = false;
  });
  
  return scheduler;
}]);
app.directive('timeLine', ['$rootScope', 'Arrangement', 'EditorConfig', 'Scheduler',
    function($rootScope, Arrangement, EditorConfig, Scheduler) {

  var fillColor = '#888';
  var height = 15;

  var render = function(canvas){
    var context = canvas[0].getContext('2d');
    var length = Arrangement.length();
    var pixelsPerSecond = EditorConfig.pixelsPerSecond;

    var width = pixelsPerSecond * length;
    canvas.prop('width', width);
    canvas.prop('height', height);

    context.clearRect(0,0,width,canvas.prop('height'));

    context.fillStyle = fillColor;

    for(var seconds = 0; seconds <= length; seconds++){
      context.fillRect(seconds * pixelsPerSecond, 0, 1, height);
      context.fillRect((seconds + .5) * pixelsPerSecond, 0, 1, height / 2);
    }
  };

  // make sure render is not called too often
  var render = _.debounce(render, 1000);

  var setSongPosition = function(event, element){
    // get the new song position from the click
    var rect = element[0].getBoundingClientRect();
    var newSongPosition = (event.x - rect.left) / EditorConfig.pixelsPerSecond;
    Scheduler.setSongPosition(newSongPosition);
  };

  return {
    restrict: 'E',
    template: '<div class="time-line"><canvas height="'+ height +'"></canvas></div>',
    link: function(scope, element, attr){
      var canvas = element.find('canvas');

      render(canvas);

      scope.$watch('config.pixelsPerSecond', function(newv, oldv){
        if(newv != oldv) render(canvas);
      });
      $rootScope.$on('bufferloader:loaded', function(){ render(canvas); });

      element.on('click', function(event){
        setSongPosition(event, canvas);
      });
    }
  }
}]);
/**
 * Caches and optimizes loading of buffers
 */
app.service('BufferLoader', ['$q', '$rootScope', 'SharedAudioContext', function($q, $rootScope, SharedAudioContext){
  return {
    _cache: {},

    _deferreds: {},

    /**
     * Checks the cache and the deferred objects first before loading the bugger
     * @param  {String} bufferLocation The location of the buffer
     * @return {Deferred} a deffered object
     */
    load: function(buffer){
      var bufferLocation = buffer.location;
      // check if it's in the cache
      if(this._cache[bufferLocation]){
        var deferred = $q.defer();
        deferred.resolve(this._cache[bufferLocation]);
        return deferred.promise;
      // check if we're already loading the buffer
      }else if(this._deferreds[bufferLocation])
        return this._deferreds[bufferLocation].promise;
      // create a new deferred and load the buffer
      else
        return this._load(bufferLocation);
    },

    /**
     * Loads the buffer from the defined source and makes sure
     * that all deferreds are logged properly
     */
    _load: function(bufferLocation){
      // new deffered for this request
      var deferred = $q.defer();
      this._deferreds[bufferLocation] = deferred;

      // load the buffer
      var xhr = new XMLHttpRequest();
      xhr.open('GET', bufferLocation, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function(e) {
        this._decodeAudio(xhr.response, deferred, bufferLocation);
      }.bind(this);
      xhr.send();

      return deferred.promise;
    },

    /**
     * Decoded's the audio, caches the buffer and resolves the deferreds
     */
    _decodeAudio: function(arrayBuffer, deferred, bufferLocation){
      SharedAudioContext.getContext().decodeAudioData(arrayBuffer, function(buffer) {
        this._deferreds[bufferLocation] = undefined;
        this._cache[bufferLocation] = buffer;
        deferred.resolve(buffer);
        $rootScope.$emit('bufferloader:loaded', buffer);
      }.bind(this), function(e) {
        deferred.reject('Error decoding file', e);
      });
    }
  };
}]);
/**
 * Uploads buffers to the server
 */
app.factory('BufferUploader', ['$q', '$rootScope', 'IDGenerator', function($q, $rootScope, IDGenerator){

  return {
    /**
     * A list of ongoing deferreds
     */
    _deferreds: {},

    /**
     * A list of ongoing requests
     */
    _requests: {},

    /**
     * Checks if the filetype is supported
     */
    supportsUploadOf: function(file){
      return (file.type && (file.type == 'audio/mp3' || file.type == 'audio/wav' || file.type == 'audio/ogg'));
    },

    /**
     * Uploads a file to the specified arrangement
     * @param  {String} arrangementId Id of the arrangement
     * @param  {File} file the file
     * @return {Promise}
     */
    upload: function(arrangementId, file){
      if(!this.supportsUploadOf(file)){
        var deferred = $q.defer();
        deferred.reject('Wrong filetype! ' + file.type);
        return deferred.promise;
      }

      var fileName = file.name;
      if(this._deferreds[fileName])
        return this._deferreds[fileName].promise;
      else
        return this._upload(arrangementId, file);
    },

    _upload: function(arrangementId, file){
      // new deffered for this request
      var fileName = file.name;
      var id = [arrangementId, IDGenerator.generate('buffer'), fileName].join('___');
      var deferred = $q.defer();
      this._deferreds[fileName] = deferred;

      var uploader = this;
      var s3Upload = new S3Upload({
        s3_object_name: id,
        s3_sign_put_url: '/sign_s3',
        onProgress: function(percent, message) {
          console.log('Upload progress: ' + percent + '% ' + message);
          deferred.notify(percent);
        },
        onFinishS3Put: function(public_url) {
          uploader._uploadComplete(public_url, deferred, fileName, id);
          console.log('uploaddone', public_url)
        },
        onError: function(status) {
          console.log('error', 'upload', status)
        }
      });

      s3Upload.uploadFile(file);

      this._requests[fileName] = s3Upload;

      return deferred.promise;
    },

    _uploadComplete: function(url, deferred, fileName, id){
      // delete all cached objects
      delete this._requests[fileName];
      delete this._deferreds[fileName];

      // the newly created buffer object
      var buffer = {
        id: id,
        location: url,
        name: fileName
      };

      $rootScope.$emit('bufferuploader:done');

      deferred.resolve(buffer);
    },

    totalFiles: function(){

    }
  };
}]);
/**
 * Generates IDs for the components
 */
app.service('IDGenerator', function(){
  return {
    /**
     * Generates a String ID
     * @param  {String} base prefix for the id
     */
    generate: function(base){
      var id = base ? base + '_' : '';
      var date = Date.now();
      var r = Math.random() * 999999;
      id += Math.random() * (date * r);
      return id;
    }
  }
});
app.factory('SharedAudioContext', [function(){
  var context;
  return {
    getContext: function(){
      if(!context)
        context = new AudioContext();
      return context;
    }
  }
}]);
// sanitizes the AudioContext
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// sanitizes getUserMedia
navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;
app.factory('utils', [function(){
  return {
    /**
     * Returns a copy of the passed object
     * @param  {Object} obj The object that should be copied
     * @return {Object}     the copy
     */
    deepCopy: function(obj){
      return JSON.parse(JSON.stringify(obj));
    }
  };
}]);
app.directive('beatsGrid', function($compile, EditorConfig, Drumkits, $rootScope, Arrangement) {

  var assignInstruments = function(scope){
    scope.instruments = Drumkits.instrumentsForKit(scope.piece.drumType);
  };

  return {
    restrict: 'A',
    templateUrl: 'partials/pieces/beats_grid.html',
    link: function(scope, element, attrs){
      assignInstruments(scope);


      scope.changeBeat = function(instrument, index, oldValue){
        var instrument = scope.node[scope.currentPatternName].data.beats[instrument];
        instrument[index] = (oldValue == 1) ? 0 : 1;
      };

      var unwatchPatternChange = scope.$watch('piece.drumType', function(){
        assignInstruments(scope);
      });

      element.on('$destroy', function(){
        unwatchPatternChange();
      });
    }
  }
});
app.controller('BufferedPieceController', ['$rootScope', '$scope', 'BufferedNode', 'Arrangement',
  function($rootScope, $scope, BufferedNode, Arrangement){

  $scope.node = new BufferedNode($scope.piece);
  Arrangement.registerPiece($scope.node.data.id, $scope.node);

  $scope.node.master = $scope.trackNode.in;
  $scope.node.context = $scope.trackNode.context;

  $scope.edit = function(){
    $scope.addAdditionalContent('<div buffered-piece-edit class="buffered-piece-edit-container"></div>', $scope);
  };

  $scope.remove = function(){
    Arrangement.removePieceFromTrack($scope.piece, $scope.track);
    $scope.node.stop();
  };

  var unwatchChange = $scope.$watch('piece.position', function(a,b){
    if(a != b)
      $scope.node.stop();
  });
}]);
app.directive('bufferedPiece', ['$compile', 'EditorConfig', 'Arrangement', 'utils', 'IDGenerator',
    function($compile, EditorConfig, Arrangement, utils, IDGenerator) {

  return {
    restrict: 'E',
    templateUrl: 'partials/pieces/buffered_piece.html',
    controller: 'BufferedPieceController',
    link: function(scope, element, attrs){
      scope.copyPiece = function(event){
        if(!event.shiftKey) return;
        var copiedPiece = utils.deepCopy(scope.piece);
        copiedPiece.position += .2;
        copiedPiece.id = IDGenerator.generate('piece');
        scope.track.pieces.push(copiedPiece);
      }
    }
  }
}]);
app.controller('BufferedPieceEditController', ['$rootScope', '$scope', 'utils', 'EditorConfig', 'Arrangement', 'BufferedRecordingNode',
  function($rootScope, $scope, utils, EditorConfig, Arrangement, BufferedRecordingNode){
    var setupRange = function(){
      // add offsets to buffer if not set
      if($scope.piece.offsetStart == undefined)
        $scope.piece.offsetStart = 0;
      if($scope.piece.offsetEnd == undefined)
        $scope.piece.offsetEnd = 0;

      $scope.leftHandle = ($scope.piece.offsetStart / $scope.node.buffer.duration) * 100;
      $scope.rightHandle = 100 - (($scope.piece.offsetEnd / $scope.node.buffer.duration) * 100);
      $scope.rangeWidth = $scope.node.buffer.duration * EditorConfig.pixelsPerSecond;
    };
    setupRange();

    // if the offsets are changed, set the handles right
    var unwatchOffsetStart = $scope.$watch('piece.offsetStart', setupRange);
    var unwatchOffsetEnd = $scope.$watch('piece.offsetEnd', setupRange);

    var handlesToOffsets = function(){
      return {
        offsetStart: ($scope.node.buffer.duration * $scope.leftHandle) / 100,
        offsetEnd: $scope.node.buffer.duration - (($scope.node.buffer.duration * $scope.rightHandle) / 100)
      }
    };

    var playNode;
    $scope.playSelection = function(){
      if(playNode)
        playNode.stop()
      var handles = handlesToOffsets();

      playNode = new BufferedRecordingNode(utils.deepCopy($scope.piece), $scope.node.buffer);
      playNode.data.offsetStart = handles.offsetStart;
      playNode.data.offsetEnd = handles.offsetEnd;
      playNode.play();
    };

    $scope.applySelection = function(){
      var handles = handlesToOffsets();
      $scope.piece.offsetStart = handles.offsetStart;
      $scope.piece.offsetEnd = handles.offsetEnd;
    };

    $scope.tearDown = function(){
      if(playNode)
        playNode.stop()
      unwatchOffsetStart();
      unwatchOffsetEnd();
    };
}]);
app.directive('bufferedPieceEdit', ['$compile', 'EditorConfig',
    function($compile, EditorConfig) {

  return {
    restrict: 'A',
    templateUrl: 'partials/pieces/buffered_piece_edit.html',
    controller: 'BufferedPieceEditController',
    link: function(scope, element, attrs){
      // set the curtain width
      var applyCurtainWidth = function(){
        angular.element(element[0].querySelector('.curtain')).css('width', scope.rangeWidth + 'px')
      };
      var unwatchRangeWidth = scope.$watch('rangeWidth', applyCurtainWidth);

      var leftCurtain = angular.element(element[0].querySelector('.curtain .left'));
      var applyLeftCurtain = function(){
        var width = (scope.leftHandle / 100) * scope.rangeWidth;
        leftCurtain.css('width', width + 'px');
      }
      var unwatchLeftHandle = scope.$watch('leftHandle', applyLeftCurtain);

      var rightCurtain = angular.element(element[0].querySelector('.curtain .right'));
      var applyRightCurtain = function(){
        var width = (1 - (scope.rightHandle / 100)) * scope.rangeWidth;
        rightCurtain.css('width', width + 'px');
      };
      var unwatchRightHandle = scope.$watch('rightHandle', applyRightCurtain);

      element.on('$destroy', function(){
        unwatchRangeWidth();
        unwatchLeftHandle();
        unwatchRightHandle();
        scope.tearDown();
      });
    }
  }
}]);
app.directive('draggablePiece', ['$rootScope', 'EditorConfig', function($rootScope, EditorConfig) {

  var updatePosition = function(scope, element, position){
    var modelPosition = scope.tone? scope.tone.position : scope.piece.position;
    position = position != undefined ? position : modelPosition * EditorConfig.pixelsPerSecond;
    element.css('left', position + 'px');
  };

  return {
    restrict: 'A',
    link: function(scope, element, attrs){

      // save the current position when draggint starts
      element.on('drag-start', function(){
        scope.currentLeft = parseInt(element.css('left').replace('px', ''), 10);
      });

      // move to the updated position when dragging
      element.on('drag', function(event, xDiff, yDiff){
        scope.currentLeft += xDiff
        updatePosition(scope, element, scope.currentLeft);
      });

      // save the updated position
      element.on('drag-end', function(){
        var newPos = parseInt(element.css('left').replace('px', ''), 10) / EditorConfig.pixelsPerSecond;
        newPos = Math.max(0, newPos);
        scope.$apply(function(){
          if(scope.tone){
            scope.tone.position = newPos;
          }else if(scope.piece){
            scope.piece.position = newPos;
            $rootScope.$emit('unschedule', scope.piece);
          }

          // also: manually trigger the re-positioning
          // the visual state could be at -7sec, the new position would be normalized to 0
          // so no chang in model state
          updatePosition(scope, element);
        });
      });

      // either watch the current piece's position or another specified value
      // if this value changes, update the visual position
      scope.$watch(attrs.position || 'piece.position', function(){
        updatePosition(scope, element);
      }, true)

      scope.$watch('config.pixelsPerSecond', function(){
        updatePosition(scope, element);
      });

      updatePosition(scope, element);
    }
  }
}])
app.controller('DrumPieceController', function($rootScope, $scope, utils, Sampler, Arrangement, Drumkits){
    $scope.node = new Sampler($scope.piece);
    $scope.node.master = $scope.trackNode.in;
    $scope.node.context = $scope.trackNode.context;

    // load the current drum kit
    Drumkits.loadKit($scope.piece.drumType);

    Arrangement.registerPiece($scope.piece.id, $scope.node);

    var unwatchDrumType = $scope.$watch('piece.drumType', function(newv, oldv){
      if(newv != oldv)
        Drumkits.loadKit($scope.piece.drumType);
    });

    $rootScope.$on('loadWatcher', function() {
      $scope.node = new Sampler($scope.piece);
      $scope.node.master = $scope.trackNode.in;
      $scope.node.context = $scope.trackNode.context;

      // load the current drum kit
      Drumkits.loadKit($scope.piece.drumType);

      Arrangement.registerPiece($scope.piece.id, $scope.node);
    });

    $scope.edit = function(){
      $scope.addAdditionalContent('<div drum-piece-edit class="drum-piece-edit-container"></div>', $scope);
    };

    $scope.remove = function(){
      unwatchDrumType();
      Arrangement.removePieceFromTrack($scope.piece, $scope.track);
      $scope.node.stop();
    };
});
app.directive('drumPiece', ['$rootScope', 'EditorConfig', 'Drumkits',
    function($rootScope, EditorConfig, Drumkits) {

  var renderBeats = function(scope, element){
    var canvasContext = element[0].getContext('2d');
    var length = scope.node.length();
    var width = length * EditorConfig.pixelsPerSecond;
    var height = parseInt(element.prop('height'));
    var instruments = Drumkits.instrumentsForKit(scope.piece.drumType);

    element.prop('width', width);

    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = '#bada55';

    // sum up all beats
    var beatSum = 0;
    scope.piece.patternOrder.forEach(function(patternName){
      beatSum += scope.piece.patterns[patternName].slots;
    });

    // calculate the necessary width and height for single beats
    var heightPerBeat = height / instruments.length;

    // render each beat
    var xOffset = 0;
    scope.piece.patternOrder.forEach(function(patternName){
      var pattern = scope.piece.patterns[patternName];
      var patternObject = scope.node[patternName];
      var widthPerBeat = patternObject.secondsBetweenBeats() * EditorConfig.pixelsPerSecond;

      instruments.forEach(function(instrument, instrumentIndex){
        // some beats may not exist, so return
        if(!pattern.beats[instrument]) return;

        // render beat if not zero
        pattern.beats[instrument].forEach(function(beat, beatIndex){
          if(beat)
            canvasContext.fillRect(
              xOffset + beatIndex * widthPerBeat,
              instrumentIndex * heightPerBeat,
              widthPerBeat,
              heightPerBeat
            )
        });
      });

      // increase the xOffset by the current width
      xOffset += pattern.slots * widthPerBeat;
    });
  };

  return {
    restrict: 'E',
    templateUrl: 'partials/pieces/drum_piece.html',
    controller: 'DrumPieceController',
    link: function(scope, element, attrs){
      // get the canvas element and render the beats
      var canvasElement = angular.element(element[0].querySelector('canvas'));

      renderBeats(scope, canvasElement);

      scope.$on('loadWatcher', function() {
        console.log(scope.piece);
        renderBeats(scope, canvasElement);        
      });

      var unwatchPixels = scope.$watch('config.pixelsPerSecond', function(oldv, newv){
        if(oldv != newv)
          renderBeats(scope, canvasElement);
      });

      var unwatchChanges = scope.$watch('piece', function(oldv, newv){
        if(oldv != newv)
          renderBeats(scope, canvasElement);
      }, true)

      element.on('$destroy', function(){
        unwatchPixels();
        unwatchChanges();
      });
    }
  }
}]);
app.controller('DrumPieceEditController', ['$rootScope', '$scope', 'BufferedNode', 'Arrangement', 'Drumkits', 'SharedAudioContext',
  function($rootScope, $scope, BufferedNode, Arrangement, Drumkits, SharedAudioContext){
    $scope.avalaibleDrumkits = Object.keys(Drumkits.kits);

    $scope.currentPatternName = 'a';
    $scope.isCurrentPattern = function(patternName){
      return $scope.currentPatternName == patternName;
    };

    $scope.showPart = function(patternName){
      if(machinePlaying)
        $scope.startStopPlayback();
      $scope.currentPatternName = patternName;
    };

    var machinePlaying = false;
    $scope.startStopPlayback = function(){
      if(machinePlaying){
        $scope.node[$scope.currentPatternName].stopLoop();
        $scope.loopBeat = -1;
      }else{
        $rootScope.$emit('force-stop');
        $scope.node[$scope.currentPatternName].loop(function(beat){
          $scope.$apply(function(){
            $scope.loopBeat = beat;
          });
        });
      }
      machinePlaying = !machinePlaying;
    };

    $scope.playState = function(){
      return (machinePlaying ? 'icon-pause' : 'icon-play');
    };

    $scope.removeFromPatternOrder = function(index){
      $scope.piece.patternOrder.splice(index, 1);
    };

    $scope.movePatternRight = function(index){
      if(index > 0){
        var swap = $scope.piece.patternOrder[index-1];
        $scope.piece.patternOrder[index-1] = $scope.piece.patternOrder[index];
        $scope.piece.patternOrder[index] = swap;
      }
    };

    $scope.movePatternLeft = function(index){
      if(index < $scope.piece.patternOrder.length - 1){
        var swap = $scope.piece.patternOrder[index+1];
        $scope.piece.patternOrder[index+1] = $scope.piece.patternOrder[index];
        $scope.piece.patternOrder[index] = swap
      }
    };

    $scope.changeSlots = function(){

      // change the slot length
      var currentPattern = $scope.node[$scope.currentPatternName].data;
      var slots = currentPattern.slots;

      Drumkits.instrumentsForKit($scope.piece.drumType).forEach(function(instrument){
        var currentBeats = currentPattern.beats[instrument];
        // fill with an empty array
        if(!currentBeats)
          currentPattern.beats[instrument] = new Array(slots);
        else{
          // if the current length is bigger, shrink the array
          if(currentBeats.length > slots){
            currentPattern.beats[instrument] = currentBeats.slice(0, slots);
          }else if(slots > currentBeats.length){
            // the new slots number is higher, add more zeros
            var slotDiff = slots - currentBeats.length;
            for(var i = 0; i < slotDiff; i++)
              currentPattern.beats[instrument].push(0);
          }
        }
      });
    };

    var currentPatternLoad = function() {
      console.log('hello2.5');
      var currentPattern = $scope.node[$scope.currentPatternName].data;
      Drumkits.instrumentsForKit($scope.piece.drumType).forEach(function(instrument){
        if(!_.isArray(currentPattern.beats[instrument]))
          currentPattern.beats[instrument] = new Array(currentPattern.slots);
        else {
          for (var i = currentPattern.slots - 1; i >= 0; i--) {
            if (currentPattern.beats[instrument][i] == undefined) {
              currentPattern.beats[instrument][i] = 0;
            }
          };
        }
      });
    }

    // add empty arrays where needed
    var unwatchCurrentPattern = $scope.$watch('currentPatternName', currentPatternLoad);

    $scope.$on('loadWatcher', currentPatternLoad);

    var unwatchPlay = $rootScope.$on('player:play', function(){
      if(machinePlaying){
        $scope.startStopPlayback();
      }
    });

    $scope.tearDown = function(){
      unwatchPlay();
      // stop the playback
      machinePlaying = true;
      $scope.startStopPlayback();
    };

}]);
app.directive('drumPieceEdit', ['$compile', 'EditorConfig',
    function($compile, EditorConfig) {

  return {
    restrict: 'A',
    templateUrl: 'partials/pieces/drum_piece_edit.html',
    controller: 'DrumPieceEditController',
    link: function(scope, element, attrs){

      // add the pattern name when one of the buttons is dragged
      element[0].querySelector('.pattern-container').addEventListener('dragstart', function(event){
        var patternName = event.target.attributes['data-pattern-name'].value;
        event.dataTransfer.setData('patternName', patternName);
      });

      var partsOrderContainer = element[0].querySelector('.parts-order-container')

      partsOrderContainer.addEventListener('dragover', function(event){
        partsOrderContainer.classList.add('drop-here');
        event.preventDefault()
        event.stopPropagation();
        return false;
      });

      partsOrderContainer.addEventListener('dragleave', function(event){
        partsOrderContainer.classList.add('drop-here');
      });

      // react to dropped patterns
      partsOrderContainer.addEventListener('drop', function(event){
        partsOrderContainer.classList.remove('drop-here');
        var patternName = event.dataTransfer.getData('patternName');

        if(patternName){
          scope.$apply(function(){
            scope.piece.patternOrder.push(patternName);
          });
        }
      });

      element.on('$destroy', function(){
        console.log('destory all watchers')
        scope.tearDown();
      });
    }
  }
}]);
app.directive('synthesizerPieceEdit', ['$compile', 'EditorConfig',
    function($compile, EditorConfig) {


  var keyToKey = {
    65: 'Cl',
    87: 'C#l',
    83: 'Dl',
    69: 'D#l',
    68: 'El',
    70: 'Fl',
    84: 'F#l',
    71: 'Gl',
    90: 'G#l',
    72: 'Al',
    85: 'A#l',
    74: 'Bl',
    75: 'Cu',
    79: 'C#u',
    76: 'Du',
    80: 'D#u',
    186: 'Eu',
    222: 'Fu',
    221: 'F#u',
    220: 'Gu'
  };

  var startOctave = '3';

  return {
    restrict: 'A',
    templateUrl: 'partials/pieces/synthesizer_piece_edit.html',
    // controller: 'DrumPieceEditController',
    link: function(scope, element, attrs){
      var playNote = function(event){
        if(keyToKey[event.keyCode]){
          var note = keyToKey[event.keyCode].replace('l', startOctave).replace('u', (parseInt(startOctave, 10) + 1).toString());
          if(!scope.node.playingNotes[note])
            scope.node.playNote(note);
        }
      };

      var stopNote = function(event){
        if(keyToKey[event.keyCode]){
          var note = keyToKey[event.keyCode].replace('l', startOctave).replace('u', (parseInt(startOctave, 10) + 1).toString());
          if(scope.node.playingNotes[note])
            scope.node.stopNote(note);
        }
      };

      window.addEventListener('keydown', playNote);
      window.addEventListener('keyup', stopNote);

      element.on('$destroy', function(){
        window.removeEventListener('keydown', playNote);
        window.removeEventListener('keyup', stopNote);
      });
    }
  }
}]);
app.controller('SynthesizerPieceController', ['$rootScope', '$scope', 'utils', 'Arrangement', 'Synthesizer', 'IDGenerator', 'EditorConfig',
  function($rootScope, $scope, utils, Arrangement, Synthesizer, IDGenerator, EditorConfig){

    $scope.node = new Synthesizer($scope.piece);
    $scope.node.master = $scope.trackNode.in;
    $scope.node.context = $scope.trackNode.context;
    $scope.synthSettings = $scope.node.data.synthSettings;

    $scope.node.setup();

    Arrangement.registerPiece($scope.node.data.id, $scope.node);

    $scope.edit = function(){
      $scope.addAdditionalContent('<div synthesizer-piece-edit class="synthesizer-piece-edit-container"></div>', $scope);
    };

    $scope.remove = function(){
      Arrangement.removePieceFromTrack($scope.piece, $scope.track);
      disconnectNodes();
    };

    var unwatchChange = $scope.$watch('piece.position', function(a,b){
      if(a != b)
        $scope.node.stop();
    });

    var resetValues = function(){
      $scope.node.setupSettings();
      $scope.node.wireUpNodes();
    };

    var disconnectNodes = function(){
      $scope.node.compressor.disconnect();
      $scope.node.compressor = null;
      $scope.node.filter.disconnect();
      $scope.node.filter = null;
      $scope.node.lfo.disconnect();
      $scope.node.lfo.stop(0);
      $scope.node.lfo = null;
      $scope.node.osc1Gain.disconnect();
      $scope.node.osc1Gain.null;
      $scope.node.osc2Gain.disconnect();
      $scope.node.osc2Gain.null;
      $scope.node.osc3Gain.disconnect();
      $scope.node.osc3Gain.null;
      $scope.node.stop();
    };

    $scope.addTone = function(note, event){
      event.stopPropagation();
      event.preventDefault();

      var toneId = IDGenerator.generate('tone');
      var newTone = {
        id: toneId,
        duration: 1,
        note: note,
        position: (event.x - 256) / EditorConfig.pixelsPerSecond
      };
      $scope.piece.tones.push(newTone);
    };

    $scope.removeTone = function(tone, event){
      event.stopPropagation();
      event.preventDefault();

      var index = $scope.piece.tones.indexOf(tone);
      if(index > -1)
        $scope.piece.tones.splice(index, 1);
    };

    var unwatchLfo = $scope.$watch('piece.synthSettings', function(oldV, newV){ if(oldV != newV) resetValues() }, true)

}]);
app.directive('synthesizerPiece', ['EditorConfig',
    function(EditorConfig) {

  var renderNotes = function(synthNode, element){
    var canvasContext = element[0].getContext('2d');
    var synthData = synthNode.data;
    var width = synthNode.length() * EditorConfig.pixelsPerSecond;
    var height = parseInt(element.prop('height'));
    var heightPerNote = height / synthNode.notes.length;

    element.prop('width', width);

    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = '#bada55';

    var currentNote;
    // render each note
    synthNode.notes.forEach(function(note, index){
      // gather all tones from this note
      var tonesFromCurrentNote = _.where(synthData.tones, {note: note});
      tonesFromCurrentNote.forEach(function(tone){
        var noteHeight = index * heightPerNote;
        var xPos = tone.position * EditorConfig.pixelsPerSecond;
        canvasContext.fillRect(
          tone.position * EditorConfig.pixelsPerSecond,
          index * heightPerNote,
          tone.duration * EditorConfig.pixelsPerSecond,
          heightPerNote
        )
      });
    });
  };

  return {
    restrict: 'E',
    templateUrl: 'partials/pieces/synthesizer_piece.html',
    controller: 'SynthesizerPieceController',
    link: function(scope, element, attrs){

      var render = function(){
        renderNotes(scope.node, element.find('canvas'));
      };

      render();

      var unwatchPixels = scope.$watch('config.pixelsPerSecond', function(newv, oldv){
        if(newv != oldv) render();
      });

      var unwatchTones = scope.$watch('piece.tones', function(newv, oldv){
        if(newv != oldv) render();
      }, true);

      element.on('$destroy', function(){
        unwatchPixels();
        unwatchTones();
      });

    }
  }
}]);
app.controller('SynthesizerPieceEditController', ['$rootScope', '$scope', 'utils', 'Arrangement', 'Synthesizer',
  function($rootScope, $scope, utils, Arrangement, Synthesizer){


}]);
app.directive('synthTone', ['$compile', 'EditorConfig',
    function($compile, EditorConfig) {

  var setWidth = function(element, duration){
    element.css('width', (EditorConfig.pixelsPerSecond * duration) + 'px');
  };

  return {
    restrict: 'A',
    templateUrl: 'partials/pieces/synth_tone.html',
    link: function(scope, element, attrs){

      var widthHandle = angular.element(element[0].querySelector('.width-handle'));
      var updateWidth = function(){
        setWidth(element, scope.tone.duration);
      };

      widthHandle.on('drag', function(event, xDiff){
        scope.tone.duration += xDiff / EditorConfig.pixelsPerSecond;
        updateWidth();
      });

      scope.$watch('tone.duration', updateWidth);

      element.on('$destroy', function(){
        console.log('destory all watchers')
      });
    }
  }
}]);
app.controller('RecordingController', function($scope, SharedAudioContext, Arrangement, BufferedRecordingNode){
    var audioStream, audioInput, analyser, gainControl;

    // Stops all streams and the recording
    var stopRecording = function(){
      if($scope.recorder)
        $scope.recorder.stop();

      gainControl.disconnect();
      analyser.disconnect();
      audioInput.disconnect();
      audioStream.stop();
      $scope.isRecording = false;
    };

    var cleanUp = function(){
      $scope.isUploading = false;
      $scope.uploadProgress = 0;
      $scope.speakers = false;
      $scope.analyser = null;
      $scope.showRecording = false;
      $scope.file = null;
      $scope.recorder = null;
      $scope.recordedNode = null;
    };

    $scope.uploadRecording = function(){
      $scope.isUploading = true;
      Arrangement.uploadBuffer($scope.file).then(function(uploadedFile){
        // FileBrowser.setActiveFile(uploadedFile.name);
        // FileBrowser.show();
        $scope.cancelRecording();
      }, function(err){
        console.log('There was an error!', err);
      }, function(percent){
        $scope.uploadProgress = percent;
      });
    };

    $scope.triggerRecording = function(){
      if($scope.isRecording){
        $scope.recorder.exportWAV(function(file){
          $scope.file = file;
          $scope.file.name = "new_recording_" + Date.now();
          var fileReader = new FileReader();
          fileReader.onload = function(){
            var arrBuffer = this.result;
            SharedAudioContext.getContext().decodeAudioData(arrBuffer, function(buffer){
              $scope.$apply(function(){
                $scope.recordedNode = new BufferedRecordingNode({}, buffer);
              });
            })
          };
          fileReader.readAsArrayBuffer(file);
        });

        stopRecording();
      }else{
        $scope.isRecording = true;
        $scope.recorder = new Recorder(analyser, {
          workerPath: 'dist/workers/recorderWorker.js'
        });
        $scope.recorder.record();
      }
    };

    $scope.cancelRecording = function(){
      stopRecording();
      cleanUp();
      $scope.removeAdditionalContent();
    };

    $scope.playRecording = function(){
      if(!$scope.recordedNode) return;
      if($scope.recordedNode.isPlaying())
        $scope.recordedNode.stop();
      else
        $scope.recordedNode.play()
    }

    $scope.$watch('speakers', function(){
      if (!gainControl) return;
      if($scope.speakers){
        gainControl.connect(SharedAudioContext.getContext().destination);
      }else{
        gainControl.disconnect();
      }
    })

    // ask for microphone access
    navigator.getUserMedia({audio: true}, function(stream){
      var context = SharedAudioContext.getContext();
      audioStream = stream;
      audioInput = context.createMediaStreamSource(audioStream);
      analyser = context.createAnalyser();

      audioInput.connect(analyser);
      gainControl = context.createGain();
      gainControl.gain.value = 1;
      audioInput.connect(gainControl);
      if($scope.speakers)
        gainControl.connect(context.destination);

      $scope.$apply(function(){
        $scope.analyser = analyser;
      });
    },function(err){
      console.log(err);
      // TODO: add proper error handling, especially for the case when users accidentally block the mic
      alert('We did not get access to your microphone, please reload and allow access again!');
    });

});
app.directive('recordingElement', function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/recording/recording-element.html',
    controller: 'RecordingController'
  }
});
app.controller('RecordingSelectionController', ['$rootScope', '$scope',
  function($rootScope, $scope){

  var close = function(){
    $scope.node = null;
    $scope.buffer = null;
    $scope.showRecordingSelection = false;
  };

  $scope.playSelection = function(){
    $scope.node.play();
  };

  $scope.uploadSelection = function(){
    
  };

  $scope.deleteRecording = function(){

  };

}]);
app.directive('recordingSelection', ['$rootScope', '$compile', 'EditorConfig', 'Arrangement',
  function($rootScope, $compile, EditorConfig, Arrangement) {

  return {
    restrict: 'A',
    controller: 'RecordingSelectionController',
    templateUrl: 'recording/recording-selection.html'
  }
}]);
var recLength = 0,
  recBuffersL = [],
  recBuffersR = [],
  sampleRate;

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
}

function record(inputBuffer){
  recBuffersL.push(inputBuffer[0]);
  recBuffersR.push(inputBuffer[1]);
  recLength += inputBuffer[0].length;
}

function exportWAV(type){
  var bufferL = mergeBuffers(recBuffersL, recLength);
  var bufferR = mergeBuffers(recBuffersR, recLength);
  var interleaved = interleave(bufferL, bufferR);
  var dataview = encodeWAV(interleaved);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}

function getBuffer() {
  var buffers = [];
  buffers.push( mergeBuffers(recBuffersL, recLength) );
  buffers.push( mergeBuffers(recBuffersR, recLength) );
  this.postMessage(buffers);
}

function clear(){
  recLength = 0;
  recBuffersL = [];
  recBuffersR = [];
}

function mergeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
app.factory('BaseAudioNode', [function(){
  return Class.extend({
    constructor: function(data) {
      this.gain = 1;
      this.data = data;
    },

    /**
     * Returns the length of this node. Each node type may need a specific implementation here.
     * @return {Number} The length in seconds
     */
    length: function(){
      return 0;
    }
  });
}])
app.factory('BufferedNode', ['BaseAudioNode', 'BufferLoader', '$q', 'Arrangement',
    function(BaseAudioNode, BufferLoader, $q, Arrangement){

  return BaseAudioNode.extend({
    constructor: function(data){
      this.data = data;
      this.buffer = undefined;
      this.source = undefined;
    },

    length: function(){
      if(this.buffer){
        // calculate the duration either from the bufferOffset or from the duration
        if(this.data.offsetStart || this.data.offsetEnd)
          // only play for the duration between the two offsets
          return this.buffer.duration - this.data.offsetStart - this.data.offsetEnd;
        else
          return this.buffer.duration;
      }else{
        return 0;
      }
    },

    /**
     * Triggers the buffer to load
     * @return {Deferred}
     */
    fetch: function(){
      var setupDeferred = $q.defer();
      if(this.buffer){
        setupDeferred.resolve(this.buffer);
      }else{
        var bufferObject = Arrangement.getBufferFromId(this.data.buffer_id);
        var loadDeferred = BufferLoader.load(bufferObject);
        loadDeferred.then(function(buffer){
          this.buffer = buffer;
          setupDeferred.resolve(buffer);
        }.bind(this));
      }
      return setupDeferred.promise;
    },

    /**
     * Is the current source node playing?
     * @return {Boolean} playing or not
     */
    isPlaying: function(){
      var source = this.source;
      return (source && source.playbackState == source.PLAYING_STATE);
    },

    /**
     * Play the node buffer
     * @param  {Number} when offset (in seconds) of when to start playing, defaults to 0
     */
    play: function(when, offset, forcedTime){
      if(!when){ when = 0; } // start immediately if not defined
      if(!offset){ offset = 0; } // no offset by default

      var master = this.master;
      var context = this.context;
      var source = context.createBufferSource();
      var gain = context.createGain();
      source.buffer = this.buffer;
      source.connect(gain)
      gain.connect(master);
      gain.gain.value = _.isNumber(this.data.gain) ? this.data.gain : 1;

      var duration = this.length();

      when = (forcedTime != undefined) ? forcedTime : (context.currentTime + when);

      // start at defined point, with defined offset, for calculated duration
      source.start(when, offset + (this.data.offsetStart || 0), duration);
      this.source = source;
      return source;
    },

    stop: function(){
      try{
        // stop node even if it is not playing (it might be scheduled)
        this.source.stop(0);
      }catch(e){
        console.log('problem while stopping a buffered node', e);
      }
    }

  });
}]);
app.factory('BufferedRecordingNode', ['BufferedNode', 'BufferLoader', '$q', 'SharedAudioContext', 'Arrangement',
    function(BufferedNode, BufferLoader, $q, SharedAudioContext, Arrangement){

  return BufferedNode.extend({
    constructor: function(data, buffer){
      this.data = data;
      this.buffer = buffer;
      this.source = undefined;
      this.bufferOffsetStart = 0;
      this.context = SharedAudioContext.getContext();
      this.master = this.context.destination;
    },

    /**
     * Triggers the buffer to load
     * @return {Deferred}
     */
    fetch: function(){
      var setupDeferred = $q.defer();

      setupDeferred.resolve(this.buffer);

      return setupDeferred.promise;
    }

  });
}]);
app.factory('Pattern', ['BufferedRecordingNode', '$q', 'BufferedNode', 'Ticker', 'Drumkits', 'SharedAudioContext',
    function(BufferedRecordingNode, $q, BufferedNode, Ticker, Drumkits, SharedAudioContext){

  return Class.extend({
    constructor: function(data, sampler){
      this.data = data;
      this.sampler = sampler;
      this.scheduledSounds = [];
      this.reset();
    },

    reset: function(){
      this.currentSlot = -1;
      this.nextBeatScheduledFor = 0;
      this.scheduledSounds.forEach(function(sound){
        sound.stop();
      });
      this.scheduledSounds = [];
    },

    hasMoreBeats: function(){
      return this.currentSlot < (this.data.slots - 1);
    },

    length: function(){
      return this.data.slots * this.secondsBetweenBeats();
    },

    secondsBetweenBeats: function(){
      return (60 / this.data.bpm) / 4;
    },

    schedule: function(startTime){
      var instruments = Drumkits.instrumentsForKit(this.sampler.data.drumType);
      var secondsBetweenBeats = this.secondsBetweenBeats();
      for(var instrumentIndex = 0; instrumentIndex < instruments.length; instrumentIndex++){
        var instrument = instruments[instrumentIndex];
        if(this.data.beats[instrument]){
          var instrStartTime = startTime;
          for(var beatIndex = 0; beatIndex < this.data.slots; beatIndex++){
            instrStartTime += secondsBetweenBeats;
            if(this.data.beats[instrument][beatIndex]){
              if(beatIndex >= this.currentSlot){
                this.scheduledSounds.push(
                  Drumkits.play(this.sampler.data.drumType, instrument, this.sampler.master, null, null, instrStartTime)
                );
              }
            }
          }
        }
      }
    },

    // loop the pattern
    loop: function(notify){
      this.ticker = new Ticker();
      this.ticker.interval = 30;
      var context = SharedAudioContext.getContext();
      var nextBeatTime = context.currentTime;
      var beat = -1;
      var lookAhead = .1;

      this.ticker.callback = function(){
        if(nextBeatTime <= context.currentTime + lookAhead){
          // set to the next beat, and sanitize it
          beat = beat + 1;
          if(beat >= this.data.slots) beat = 0;

          nextBeatTime += this.secondsBetweenBeats();

          Drumkits.instrumentsForKit(this.sampler.data.drumType).forEach(function(instrument){
            if(this.data.beats[instrument][beat]){
              Drumkits.play(this.sampler.data.drumType, instrument, this.sampler.master, null, null, nextBeatTime - lookAhead)
            }
          }.bind(this));

          notify(beat);
        }
      }.bind(this);
      this.ticker.start();
    },

    stopLoop: function(){
      if(this.ticker)
        this.ticker.stop();
    }
  })
}]);
app.factory('Sampler', ['$q', '$timeout', 'BaseAudioNode', 'Ticker', 'SharedAudioContext', 'BufferedNode', 'Pattern',
    function($q, $timeout, BaseAudioNode, Ticker, SharedAudioContext, BufferedNode, Pattern){

  return BaseAudioNode.extend({
    /**
     * The currently playing patter
     * @type {Pattern}
     */
    currentPattern: null,

    /**
     * The position of the current pattern
     * @type {Number}
     */
    patternOrderPosition: 0,

    lookAhead: .1,

    constructor: function(data){
      this.data = data;

      this.createPatterns();
      this.resetCurrentPattern();

      this.ticker = new Ticker();
      this.ticker.interval = 100;
      this.ticker.callback = this.ontick.bind(this);
    },

    createPatterns: function(){
      Object.keys(this.data.patterns).forEach(function(patterName){
        this[patterName] = new Pattern(this.data.patterns[patterName], this);
        this[patterName].context = this.context;
        this[patterName].master = this.master;
      }.bind(this));
    },

    resetCurrentPattern: function(){
      this.currentPatternIndex = 0;
      this.currentPattern = this[this.data.patternOrder[this.currentPatternIndex]];
    },

    nextPatternStartTime: function(){
      var nextPatternIndex = this.currentPatternIndex + 1;
      // get the time sum from all previous patterns
      var timeOffsetForNextPattern = 0;
      for(var i = 0; i < this.currentPatternIndex; i++){
        var pattern = this[this.data.patternOrder[i]];
        timeOffsetForNextPattern += pattern.length();
      }

      return (this.startedAtWithoutOffset + timeOffsetForNextPattern);
    },

    scheduleNextPattern: function(startTime){
      this.currentPattern.schedule(startTime);
      this.currentPattern.scheduled = true;
      this.currentPatternIndex++;
      this.currentPattern = this[this.data.patternOrder[this.currentPatternIndex]];
    },

    ontick: function(){
      var currentTime = this.context.currentTime;

      if(this.hasNextPattern()){
        if((currentTime + this.lookAhead) > this.nextPatternStartTime()){
          this.scheduleNextPattern(this.nextPatternStartTime());

          if(this.offsetCalculated){
            this.currentPattern.currentSlot = 0;
            this.offsetCalculated = false;
          }
        }
      }else{
        // all sounds have been scheduled, ticker can be stopped
        this.ticker.stop();
        // it's save to stop and release all sounds when the length has passed
        var timeoutTime = this.length() * 1000;
        this.stopTimeout = setTimeout(this.stop.bind(this), timeoutTime)
      }
    },

    hasNextPattern: function(){
      return (this.currentPattern && !this.currentPattern.scheduled) || 
              this.currentPatternIndex < (this.data.patternOrder.length);
    },

    length: function(){
      var length = 0;
      this.forEachPatternInOrder(function(pattern){
        length += pattern.length();
      });
      return length;
    },

    play: function(when, offset){
      this.startedAt = this.context.currentTime + when;
      this.startedAtWithoutOffset = this.startedAt - offset;
      this.offset = offset;

      if(!this.currentPattern) this.resetCurrentPattern();

      if(offset > 0){
        this.offsetCalculated = true;
        this.calculateOffset(offset);
      }

      this.ticker.start();
    },

    stop: function(){
      clearTimeout(this.stopTimeout);
      this.ticker.stop();
      this.forEachPattern(function(pattern){
        pattern.reset();
        pattern.scheduled = false;
      });
      this.resetCurrentPattern()
    },

    forEachPattern: function(cb){
      for(var patternName in this.data.patterns){
        var res = cb(this[patternName]);
        if(res === false) break;
      };
    },

    forEachPatternInOrder: function(cb){
      // iterate over pattern in patternOrder
      for(var i = 0; i < this.data.patternOrder.length; i++){
        var res = cb(this[this.data.patternOrder[i]], i);
        if(res === false) break;
      }
    },

    calculateOffset: function(offset){
      var relativeOffset = 0;
      var currentPattern = null;
      var currentPatternIndex = 0;

      // select the current pattern from the offset
      this.forEachPatternInOrder(function(pattern, index){
        relativeOffset += pattern.length();

        var length = pattern.length();
        if(offset < relativeOffset + length){
          currentPattern = pattern;
          currentPatternIndex = index;
          return false;
        }
        else{
          relativeOffset += length;
        }
      });

      this.currentPattern = currentPattern;
      this.currentPatternIndex = currentPatternIndex;

      // find out the current beat
      var beat = Math.ceil((offset - (relativeOffset - currentPattern.length())) / this.currentPattern.secondsBetweenBeats());
      this.currentPattern.currentSlot = beat - 1;
    }
  });
}]);
app.factory('Synthesizer', ['BaseAudioNode', 'BufferLoader', '$q', 'Arrangement',
    function(BaseAudioNode, BufferLoader, $q, Arrangement){

  var _oscillators = [];
  var getNewOscillator = function(context){
    var osc = context.createOscillator();
    var gain = context.createGain();
    osc.connect(gain);
    return { osc: osc, gain: gain };
  };

  var releaseOscillator = function(osc){

  };


  return BaseAudioNode.extend({
    oscillatorTypes: ['sine', 'square', 'sawtooth', 'triangle'],
    filterTypes: ['lowpass','highpass','bandpass','lowshelf','highshelf','peaking','notch','allpass'],
    notes: ['A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'],

    constructor: function(data){
      this.playingNotes = {};
      this.data = data;
    },

    setup: function(){
      this.setupNodes();
      this.setupSettings();
      this.wireUpNodes();
    },

    setupNodes: function(){
      this.lfo = this.context.createOscillator();
      this.lfo.start(0);
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.connect(this.master);
      this.osc1Gain = this.context.createGain();
      this.osc2Gain = this.context.createGain();
      this.osc3Gain = this.context.createGain();
      this.filter = this.context.createBiquadFilter();
    },

    setupSettings: function(){
      var settings = this.data.synthSettings;
      // LFO
      this.lfo.frequency.value = parseInt(settings.lfo.frequency, 10);
      this.lfo.type = settings.lfo.type;
      // OSCGAIN
      this.osc1Gain.gain.value = parseFloat(settings.osc1.gain);
      this.osc2Gain.gain.value = parseFloat(settings.osc2.gain);
      this.osc3Gain.gain.value = parseFloat(settings.osc3.gain);
      // FILTER
      this.filter.frequency.value = parseInt(settings.filter.frequency, 10);
      this.filter.type = settings.filter.type;
    },

    wireUpNodes: function(){
      this.osc1Gain.disconnect();
      this.osc2Gain.disconnect();
      this.osc3Gain.disconnect();
      this.filter.disconnect();

      // connect to the filter only of activated
      if(this.data.synthSettings.filter.activate){
        this.osc1Gain.connect(this.filter);
        this.osc2Gain.connect(this.filter);
        this.osc3Gain.connect(this.filter);
        this.filter.connect(this.compressor);
      }else{
        this.osc1Gain.connect(this.compressor);
        this.osc2Gain.connect(this.compressor);
        this.osc3Gain.connect(this.compressor);
      }
    },

    setupOscillator: function(oscillator, index){
      var settings = this.data.synthSettings;
      var currentOscSettings = settings['osc'+index];
      oscillator.type = currentOscSettings.type;
      oscillator.detune.value = parseFloat(currentOscSettings.detune);
    },

    wireUpOscillator: function(oscillator, index){
      oscillator.connect(this['osc'+index+'Gain']);
    },

    length: function(){
      var length = 0;
      this.data.tones.forEach(function(tone){
        var currLength = tone.position + tone.duration;
        length = currLength > length ? currLength : length;
      });
      return length;
    },

    play: function(when, offset, forcedTime){
      if(!when){ when = 0; } // start immediately if not defined
      if(!offset){ offset = 0; } // no offset by default

      this.startedAt = this.context.currentTime + when;
      this.startedAtWithoutOffset = this.startedAt - offset;
      this.offset = offset;

      console.log('TODO: calculate offset');

      this.data.tones.forEach(function(tone){
        var start = when + tone.position;
        var end = start + tone.duration;
        this.playNote(tone.note, start, end);
      }.bind(this));
    },

    playNote: function(note, when, end){
      console.log('when', when ,'end', end);
      // if not specified, play now
      if(when == undefined) when = 0;

      var oscillators = [getNewOscillator(this.context), getNewOscillator(this.context), getNewOscillator(this.context)];
      var frequency = this.noteToFrequency(note);
      var envelopeSettings = this.data.synthSettings.toneEnvelope;
      var now = this.context.currentTime;
      var startTime = now + when;
      var endTime = (end != undefined) ? end + now : undefined;

      var attack = parseFloat(envelopeSettings.attack);
      var decay = parseFloat(envelopeSettings.decay);
      var release = parseFloat(envelopeSettings.release);

      var sustain = Math.min(parseFloat(envelopeSettings.sustain), 1);
      var peak = Math.min(sustain + parseFloat(envelopeSettings.boost), 1);

      // calculate the time of the sustain length of the tone minus the envelope times
      var sustainLength = 0;
      var length = 0;
      if(end != undefined){
        sustainLength = end + now - startTime;
        sustainLength = sustainLength - attack - decay - release;
        length = end - when;
      }

      // calculate envelope times
      var peakTime = startTime + attack;
      var decayTime = peakTime + decay;
      var sustainTime = decayTime + sustainLength;
      var releaseTime = sustainTime + release;

      var endsDuringAttack = (endTime != undefined) ? (peakTime > endTime) : false;
      var endsDuringDecay = (endTime != undefined) ? (decayTime > endTime) : false;
      var endsDuringSustain = (endTime != undefined) ? (sustainTime > endTime) : false;
      var endsDuringRelease = (endTime != undefined) ? (releaseTime > endTime) : false;

      console.log(envelopeSettings.attack, envelopeSettings.decay, length, envelopeSettings.release);
      console.log(peakTime, decayTime, sustainTime, releaseTime);

      for(var i = 0; i < 3; i++){
        var osc = oscillators[i].osc;
        var gain = oscillators[i].gain;
        this.setupOscillator(osc, i+1);
        this.wireUpOscillator(gain, i+1);
        osc.frequency.value = frequency;
        this.lfo.connect(osc.frequency);

        gain.gain.cancelScheduledValues(startTime);
        gain.gain.setValueAtTime(0, startTime);

        // attack
        if(!endsDuringAttack){
          gain.gain.linearRampToValueAtTime(peak, peakTime);
        }else{
          var stopTime = peakTime - (peakTime - endTime);
          gain.gain.linearRampToValueAtTime(peak, stopTime);
          gain.gain.setValueAtTime(0, stopTime + 0.01);
        }
        // decay
        if(!endsDuringAttack && !endsDuringDecay){
          gain.gain.linearRampToValueAtTime(sustain, decayTime);
        }else{
          var stopTime = decayTime - (decayTime - endTime);
          gain.gain.linearRampToValueAtTime(sustain, stopTime);
          gain.gain.setValueAtTime(0, stopTime + 0.01);
        }
        // sustain
        if(!endsDuringAttack && !endsDuringDecay && !endsDuringSustain){
          gain.gain.setValueAtTime(sustain, sustainTime);
        }else{
          var stopTime = sustainTime - (sustainTime - endTime);
          gain.gain.setValueAtTime(sustain, stopTime);
          gain.gain.setValueAtTime(0, stopTime + 0.01);
        }

        if(end != undefined){
          // release
          if(!endsDuringAttack && !endsDuringDecay && !endsDuringSustain && !endsDuringRelease){
            gain.gain.linearRampToValueAtTime(0, releaseTime);
          }else{
            var stopTime = releaseTime - (releaseTime - endTime);
            gain.gain.setValueAtTime(0, stopTime);
          }
        }

        osc.start(startTime);
      }

      this.playingNotes[note] = oscillators;
    },

    stop: function(){
      Object.keys(this.playingNotes).forEach(function(note){
        this.disconnectOscillators(this.playingNotes[note]);
      }.bind(this))
      this.playingNotes = {};
    },

    stopNote: function(note){
      this.disconnectOscillators(this.playingNotes[note])
      delete this.playingNotes[note];
    },

    disconnectOscillators: function(oscillators){
      if(!oscillators) return;

      oscillators.forEach(function(oscObject){
        try{
          oscObject.gain.disconnect();
          oscObject.gain = null;
          oscObject.osc.stop(0);
          oscObject.osc.disconnect();
          oscObject.osc = null;
        }catch(e){
          console.log('error disconnecting oscillators', e);
        }
      });

      oscillators = null;
    },

    loop: function(offset){

    },

    tonesByNote: function(note){
      return _.where(this.data.tones, {note: note});
    },

    // converts notes to frequencies, taken from:
    //  Qwerty Hancock keyboard library v0.3
    //  Copyright 2012-13, Stuart Memo
    //
    //  Licensed under the MIT License
    //  http://opensource.org/licenses/mit-license.php
    noteToFrequency: function (note) {
      var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
          key_number,
          octave;

      if (note.length === 3) {
          octave = note.charAt(2);
      } else {
          octave = note.charAt(1);
      }

      key_number = notes.indexOf(note.slice(0, -1));

      if (key_number < 3) {
          key_number = key_number + 12 + ((octave - 1) * 12) + 1;
      } else {
          key_number = key_number + ((octave - 1) * 12) + 1;
      }

      return 440 * Math.pow(2, (key_number - 49) / 12);
    }
  });

}]);
app.factory('Track', ['BaseAudioNode', 'Arrangement',
    function(BaseAudioNode, Arrangement){

  return BaseAudioNode.extend({
    constructor: function(data){
      this.data = data;

      // sanitize gain value
      if(this.data.gain == undefined)
        this.data.gain = 1;

      this.context = Arrangement.context;
      this.in = this.context.createGain();
      this.in.gain.value = this.data.gain;
      this.in.connect(Arrangement.master);
    }
  });

}]);