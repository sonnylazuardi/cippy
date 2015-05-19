app.controller('SharePanelController', function($rootScope, $scope, Arrangement, Chat, $http, $auth, Account, $stateParams, _SharedDB, _UserDB, _ArrangementDB, CouchURL){
    
  $scope.arrangement_id = $stateParams.arrangement_id;
  var SharedDB = new PouchDB(CouchURL + _SharedDB);
  var UserDB = new PouchDB(CouchURL + _UserDB);
  $scope.shared = [];
  $scope.users = [];

  $scope.hideSharePanel = function(){
    $rootScope.showSharePanel = false;
  };

  $scope.add = function(user) {
    SharedDB.post({
      title: Arrangement.doc.title,
      arrangement: Arrangement.doc._id,
      user: user.facebook,
      profile: user,
    }).then(function (data) {
      $scope.refresh();
    });
  }

  $scope.remove = function(shared) {
    var r = confirm("Are you sure want to remove ?");
    if (r == true) {
      SharedDB.remove(shared).then(function(data) {
        $scope.refresh();
      });
    }
  }

  $scope.refresh = function() {
    SharedDB.query(function(doc) {
      emit(doc.arrangement)
    }, {startkey: $scope.arrangement_id, endkey: $scope.arrangement_id, include_docs: true}).then(function (data) {
      $scope.$apply(function() {
        $scope.shared = _.map(data.rows, function(item) {
          return item.doc;
        });
      });
    });

    UserDB.allDocs({include_docs: true}).then(function (data) {
      $scope.$apply(function() {
        $scope.users = _.map(data.rows, function(item) {
          return item.doc;
        });
      });
    });
  }

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
    });

  $scope.refresh();
});