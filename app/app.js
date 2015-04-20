var app = angular.module('cippy', [
  'partials', 
  'ngSanitize',
  'ui.router',
  'satellizer'
]); 

app.constant('ArrangementID', 'dokumenmusik');
app.config(function($stateProvider, $urlRouterProvider, $authProvider) {
  
  $authProvider.facebook({
    clientId: '468348829982756'
  });

  $urlRouterProvider.otherwise("/home");
  $stateProvider
    .state('home', {
      url: "/home",
      templateUrl: "partials/home.html",
      controller: "HomeController",
    })
    .state('logout', {
      url: '/logout',
      template: null,
      controller: 'LogoutController'
    })
    .state('editor', {
      url: "/editor",
      templateUrl: "partials/editor.html",
      controller: 'EditorController',
      resolve: {
        authenticated: function($q, $location, $auth) {
          var deferred = $q.defer();

          if (!$auth.isAuthenticated()) {
            $location.path('/home');
          } else {
            deferred.resolve();
          }

          return deferred.promise;
        }
      },
    });
});