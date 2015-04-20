app.controller('EditorController', function($rootScope, $scope, Arrangement, EditorConfig, Sampler, BufferedNode, $auth, Account){

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
        // $rootScope.arrangement = Arrangement.doc;
        // console.log($rootScope.arrangement);
        // console.log($scope.arrangement);
      });
    });

    $scope.getProfile();

});