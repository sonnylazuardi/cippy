app.controller('CommunicationPanelController', function($rootScope, $scope, Arrangement, Chat, $http, $auth, Account, $stateParams, Cippy, CouchURL, _ChatDB){
    
  $scope.arrangement_id = $stateParams.arrangement_id;
  $scope.hideCommunicationPanel = function(){
    $rootScope.showCommunicationPanel = false;
  };

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
    });

  $scope.message = '';
  $scope.chats = [];

  var Chat = new Cippy(CouchURL + _ChatDB);
  Chat.bindTo($scope, 'chats');
  // $scope.chats = [];
  // Chat.bind($scope.arrangement_id, $scope, 'chats');

  $scope.send = function() {
    var newMessage = {
      _id: new Date().toISOString(),
      arrangement_id: $scope.arrangement_id,
      content: $scope.message,
      user: $scope.user,
      time: new Date(),
    };
    Chat.add(newMessage);
    $scope.message = '';

  }

});