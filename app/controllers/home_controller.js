app.controller('HomeController', function($rootScope, $scope, $auth, $state){

  if ($auth.isAuthenticated()) {
    $state.go('project');
  }

  $scope.authenticate = function(provider) {

    $auth.authenticate(provider)
      .then(function() {
        console.log('successfully logged');
        $state.go('project');
      })
      .catch(function(response) {
        console.log('failed to log in');
        console.log(response.data ? response.data.message : response);
      });
  };
});