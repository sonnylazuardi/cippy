app.controller('LogoutController', function($rootScope, $scope, $auth, $state){

  if (!$auth.isAuthenticated()) {
    return;
  }
  $auth.logout()
    .then(function() {
      $state.go('home');
    });

});