app.factory('Chat', function() {
  var remote = 'http://kabin.id:5984/cippy_chats';
  var ChatDB = new PouchDB('cippy_chats');
  var opts = {live: true, retry: true};
  var self = this;
  self.scope = {};
  self.name = '';
  self.arrangement = '';

  self.syncing = function(doc) {
    if (self.arrangement != '') {
      ChatDB.query(function (doc, emit) {
        if (doc.arrangement_id === self.arrangement) {
          emit(doc.time, doc);
        }
      }, {include_docs: true}).then(function (docs) {
        self.scope.$apply(function() {
          self.scope[self.name] = _.map(docs.rows, function(item) {
            return item.doc;
          });
        });
      }).catch(function (err) {
        console.log(err);
      });
    }
  }

  ChatDB.sync(remote, opts);
  ChatDB.changes({
    since: 'now',
    live: true,
  }).on('change', self.syncing);

  return {
    add: function(item) {
      console.log(item);
      self.scope[self.name].push(item);
      ChatDB.put(item).then(function (result) {

      }).catch(function(err) {
        console.log(err);
      });
    },
    bind: function(arrangement, $scope, name) {
      self.scope = $scope;
      self.name = name;
      self.arrangement = arrangement;
      self.syncing();
    },
  };
});

