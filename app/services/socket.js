app.factory('Socket', function($rootScope, IDGenerator, $timeout) {
  var self = this;
  self.socket = io();
  self.arrangement = {};
  self.currentTrack = '';

  self.update = function() {
    $rootScope.$apply(function() {
      $rootScope.arrangement = self.arrangement.doc;  
    });

    $rootScope.$emit('sync');
    $rootScope.$emit('synced');
    $rootScope.$emit('loadWatcher');
  }

  self.socket.on('addTrack', function (data) {

    self.arrangement.addTrack('drums', function(currentId) {
      self.currentTrack = currentId;
    });

    console.log('::DEBUG:: addTrack');
    console.log(window.performance.now() + window.performance.timing.navigationStart);

    self.update();
  });

  self.socket.on('movePiece', function (data) {
    $timeout(function() {
      console.log(self.currentTrack);
      // var random = Math.floor((Math.random() * self.arrangement.doc.tracks.length) + 1) - 1;
      var find = _.findWhere(self.arrangement.doc.tracks, {id: self.currentTrack});

      if (find) {
        var randomPiece = Math.floor((Math.random() * find.pieces.length) + 1) - 1;
        var randomPos = Math.floor((Math.random() * 10) + 1);
        find.pieces[randomPiece].position = randomPos;
      }

      console.log('::DEBUG:: movePiece');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      self.update();
    });
  });

  self.socket.on('addPiece', function (data) {
    $timeout(function() {
      console.log(self.currentTrack);
      // var random = Math.floor((Math.random() * self.arrangement.doc.tracks.length) + 1) - 1;
      var find = _.findWhere(self.arrangement.doc.tracks, {id: self.currentTrack});
      if (find) {
        find.pieces.push({
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
        });
      }

      console.log('::DEBUG:: addPiece');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      self.update();
    });
  });

  self.socket.on('deletePiece', function (data) {
    $timeout(function() {
      console.log(self.currentTrack);
      // var random = Math.floor((Math.random() * self.arrangement.doc.tracks.length) + 1) - 1;
      var find = _.findWhere(self.arrangement.doc.tracks, {id: self.currentTrack});
      if (find) {
        find.pieces = _.without(find.pieces, find.pieces[0]);
      }

      console.log('::DEBUG:: deletePiece');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      self.update();
    });
  });

  self.socket.on('deleteTrack', function (data) {
    $timeout(function() {
      console.log(self.currentTrack);
      // var random = Math.floor((Math.random() * self.arrangement.doc.tracks.length) + 1) - 1;
      var find = _.findWhere(self.arrangement.doc.tracks, {id: self.currentTrack});
      if (find) {
        self.arrangement.doc.tracks = _.without(self.arrangement.doc.tracks, find);
      }

      console.log('::DEBUG:: deletePiece');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      self.update();
    });
  });

  self.socket.on('changeTitle', function (data) {
    $timeout(function() {

      // alert(self.currentTrack);
      // var random = Math.floor((Math.random() * self.arrangement.doc.tracks.length) + 1) - 1;
      var find = _.findWhere(self.arrangement.doc.tracks, {id: self.currentTrack});
      console.log(find);
      if (find) {
        find.title = self.currentTrack;
      }

      console.log('::DEBUG:: changeTitle');
      console.log(window.performance.now() + window.performance.timing.navigationStart);

      self.update();
    });
  });

  return self;

});