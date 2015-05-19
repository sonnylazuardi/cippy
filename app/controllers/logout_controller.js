app.controller('LogoutController', function($rootScope, $scope, $auth, $state){

  // alert('logout');
  
  // if (!$auth.isAuthenticated()) {
  //   return;
  // }

  $auth.logout()
    .then(function() {
      $state.go('home');
    });

});