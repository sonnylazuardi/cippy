app.controller('EditorController', function($rootScope, $scope, Arrangement, EditorConfig, Sampler, BufferedNode){

    $scope.arrangement = Arrangement.doc;
    $scope.config = EditorConfig;

    $rootScope.$on('sync', function(){
      $scope.$apply(function(){
        $scope.arrangement = Arrangement.doc;
      })
    });

});