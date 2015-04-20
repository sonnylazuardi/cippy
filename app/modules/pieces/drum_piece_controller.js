app.controller('DrumPieceController', function($rootScope, $scope, utils, Sampler, Arrangement, Drumkits){
    $scope.node = new Sampler($scope.piece);
    $scope.node.master = $scope.trackNode.in;
    $scope.node.context = $scope.trackNode.context;

    // load the current drum kit
    Drumkits.loadKit($scope.piece.drumType);

    Arrangement.registerPiece($scope.piece.id, $scope.node);

    var unwatchDrumType = $scope.$watch('piece.drumType', function(newv, oldv){
      if(newv != oldv)
        Drumkits.loadKit($scope.piece.drumType);
    });

    $rootScope.$on('loadWatcher', function() {
      $scope.node = new Sampler($scope.piece);
      $scope.node.master = $scope.trackNode.in;
      $scope.node.context = $scope.trackNode.context;

      // load the current drum kit
      Drumkits.loadKit($scope.piece.drumType);

      Arrangement.registerPiece($scope.piece.id, $scope.node);
    });

    $scope.edit = function(){
      $scope.addAdditionalContent('<div drum-piece-edit class="drum-piece-edit-container"></div>', $scope);
    };

    $scope.remove = function(){
      unwatchDrumType();
      Arrangement.removePieceFromTrack($scope.piece, $scope.track);
      $scope.node.stop();
    };
});