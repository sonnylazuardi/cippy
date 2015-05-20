var app = angular.module('cippy', [
  'partials', 
  'ngSanitize',
  'ui.router',
  'satellizer'
]); 

app.constant('ArrangementID', 'dokumenmusik');
app.constant('CouchURL', 'http://localhost:5984/');
app.constant('_ArrangementDB', 'cippy_arrangements');
app.constant('_ChatDB', 'cippy_chats');
app.constant('_UserDB', 'cippy_users');
app.constant('_SharedDB', 'cippy_shared');
app.constant('_ProjectDB', 'cippy_projects');

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
    .state('project', {
      url: '/project',
      templateUrl: 'partials/project.html',
      controller: 'ProjectController'
    })
    .state('editor', {
      url: "/editor/:arrangement_id",
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
          return;
        }
      },
    })
    .state('editor_test', {
      url: "/editor_test/:arrangement_id",
      templateUrl: "partials/editor.html",
      controller: 'EditorController',
    });
});