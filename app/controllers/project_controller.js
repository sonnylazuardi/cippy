app.controller('ProjectController', function($rootScope, $scope, $auth, $state, _UserDB, _SharedDB, _ArrangementDB, CouchURL, Account){

  if (!$auth.isAuthenticated()) {
    $state.go('home');
  }

  var ArrangementDB = new PouchDB(CouchURL + _ArrangementDB);
  var UserDB = new PouchDB(CouchURL + _UserDB);
  var SharedDB = new PouchDB(CouchURL + _SharedDB);
  $scope.projects = [];
  $scope.users = [];

  $scope.add = function() {
    var arrangement = prompt("Please enter your new arrangement name", "New Arrangement");

    if (arrangement != null) {
      var slug = arrangement.replace(/(^\-+|[^a-zA-Z0-9\/_| -]+|\-+$)/g, '').toLowerCase().replace(/[\/_| -]+/g, '-');
      ArrangementDB.putIfNotExists({
        _id: slug,
        title: arrangement,
        author: $scope.user.facebook,
        tracks: [],
        buffers: []
      }).then(function (data) {
        $scope.refresh();
      });
    }
  }

  $scope.remove = function(arrangement) {
    var r = confirm("Are you sure want to remove "+arrangement.title+"?");
    if (r == true) {
      ArrangementDB.remove(arrangement).then(function(data) {
        $scope.refresh();
      });
    }
  }

  $scope.removeShared = function(shared) {
    var r = confirm("Are you sure want to remove ?");
    if (r == true) {
      SharedDB.remove(shared).then(function(data) {
        $scope.refresh();
      });
    }
  }

  $scope.refresh = function() {
    var data = $scope.user;
    // console.log(data);

    UserDB.allDocs({include_docs: true}).then(function (data) {
      $scope.$apply(function() {
        $scope.users = _.map(data.rows, function(item) {
          return item.doc;
        });
      });
    });

    SharedDB.query(function(doc) {
      emit(doc.user)
    }, {startkey: data.facebook, endkey: data.facebook, include_docs: true}).then(function (data) {
      $scope.$apply(function() {
        $scope.shared = _.map(data.rows, function(item) {
          return item.doc;
        });
      });
    });

    ArrangementDB.query(function(doc) {
      emit(doc.author)
    }, {startkey: data.facebook, endkey: data.facebook, include_docs: true}).then(function (data) {
      $scope.$apply(function() {
        $scope.projects = _.map(data.rows, function(item) {
          return item.doc;
        });
      });
    });
  }

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
      $rootScope.user = data;
      $scope.refresh();
    });  
});

