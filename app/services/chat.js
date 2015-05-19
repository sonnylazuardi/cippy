app.factory('Chat', function(CouchURL, _ChatDB) {
  var remote = CouchURL + _ChatDB;
  var ChatDB = new PouchDB(_ChatDB);
  var opts = {live: true, retry: true};
  var self = this;
  self.scope = {};
  self.name = '';
  self.arrangement = '';

  self.syncing = function(doc) {
    if (self.arrangement != '') {
      ChatDB.query(function (doc, emit) {
        emit(doc.arrangement_id);
      }, {startkey: self.arrangement, endkey: self.arrangement, include_docs: true}).then(function (docs) {
        self.scope.$apply(function() {
          self.scope[self.name] = _.map(docs.rows, function(item) {
            return item.doc;
          });
        });
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

