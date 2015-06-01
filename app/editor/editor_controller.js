app.controller('EditorController', function($rootScope, $scope, Arrangement, EditorConfig, Sampler, BufferedNode, $auth, Account, $stateParams, $interval, CouchURL){
    $scope.arrangement_id = $stateParams.arrangement_id;
    Arrangement.arrangement_id = $stateParams.arrangement_id;
    Arrangement.init();

    $scope.arrangement = Arrangement.doc;
    $scope.config = EditorConfig;

    Offline.options = {checks: {xhr: {url: CouchURL}}};

    var run = $interval(function() {
      if (Offline.state === 'up')
        Offline.check();
    }, 5000);

    var offline = {};

    Offline.on('down', function() {
      console.log('GOING DOWN');
      Arrangement.goOffline();
      // alert(Arrangement.offlineStamp);
      offline = _.clone(Arrangement.doc, true);
      // Arrangement.offline = [];
      // console.log(offline);
    });

    Offline.on('up', function() {
      console.log('GOING UP');
      Arrangement.goOnline();
      var currentDoc = _.clone(Arrangement.doc, true);
      var delta = jsondiffpatch.diff(offline, currentDoc);
      if (delta) {
        Arrangement.setDelta(delta);
        console.log(delta);
      }      
    });

    $scope.$destroy = function() {
      $interval.cancel(run);
      Offline.off('down');
      Offline.off('up');
    }

    /**
     * Get user's profile information.
     */
    $scope.getProfile = function() {
      Account.getProfile()
        .success(function(data) {
          $scope.user = data;
        })
        .error(function(error) {
          console.log(error);
        });
    };

    $rootScope.$on('sync', function(){
      $scope.$apply(function(){
        $scope.arrangement = Arrangement.doc;
      });
    });

    $scope.getProfile();

});