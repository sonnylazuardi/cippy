app.controller('EditorController', function($rootScope, $scope, Arrangement, EditorConfig, Sampler, BufferedNode, $auth, Account, $stateParams){
    $scope.arrangement_id = $stateParams.arrangement_id;
    Arrangement.arrangement_id = $stateParams.arrangement_id;
    Arrangement.init();

    $scope.arrangement = Arrangement.doc;
    $scope.config = EditorConfig;

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