app.controller('CommunicationPanelController', function($rootScope, $scope, Arrangement, Chat, $http, $auth, Account, ArrangementID){
    
  $scope.hideCommunicationPanel = function(){
    $rootScope.showCommunicationPanel = false;
  };

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
    });

  $scope.message = '';
  $scope.chats = [];
  Chat.bind(ArrangementID, $scope, 'chats');

  $scope.send = function() {
    var newMessage = {
      _id: new Date().toISOString(),
      arrangement_id: ArrangementID,
      content: $scope.message,
      user: $scope.user,
      time: new Date(),
    };
    Chat.add(newMessage);
    $scope.message = '';

  }

});