app.controller('ProjectController', function($rootScope, $scope, $auth, $state, _UserDB, _SharedDB, _ArrangementDB, CouchURL, Account, Cippy){

  if (!$auth.isAuthenticated()) {
    $state.go('home');
  }

  var ArrangementDB = null;
  var SharedDB = null;
  var UserDB = null;

  $scope.projects = [];
  $scope.users = [];
  $scope.shared = [];

  $scope.add = function() {
    var arrangement = prompt("Please enter your new arrangement name", "New Arrangement");

    if (arrangement != null) {
      var slug = arrangement.replace(/(^\-+|[^a-zA-Z0-9\/_| -]+|\-+$)/g, '').toLowerCase().replace(/[\/_| -]+/g, '-');
      ArrangementDB.add({
        _id: slug,
        title: arrangement,
        author: $scope.user.facebook,
        tracks: [],
        buffers: []
      });
    }
  }

  $scope.remove = function(arrangement) {
    var r = confirm("Are you sure want to remove "+arrangement.title+"?");
    if (r == true) {
      ArrangementDB.remove(arrangement).then(function () {
        var rel = new Cippy(CouchURL + _SharedDB, {arrangement: arrangement._id});
        rel.syncing().then(function() {
          console.log(rel.data);
          rel.clear();
        });
      });
    }
  }


  $scope.removeShared = function(shared) {
    var r = confirm("Are you sure want to remove ?");
    if (r == true) {
      SharedDB.remove(shared);
    }
  }

  $scope.refresh = function() {
    var data = $scope.user;
    ArrangementDB = new Cippy(CouchURL + _ArrangementDB, {author: data.facebook});
    UserDB = new Cippy(CouchURL + _UserDB);
    SharedDB = new Cippy(CouchURL + _SharedDB, {user: data.facebook});

    ArrangementDB.bindTo($scope, 'projects');
    UserDB.bindTo($scope, 'users');
    SharedDB.bindTo($scope, 'shared');
  }

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
      $rootScope.user = data;
      $scope.refresh();
    });  
});

