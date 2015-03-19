app.directive('editorControls', function($templateCache) {
  return {
    restrict: 'E',
    templateUrl: 'partials/editor/controls.html',
    controller: 'EditorControlsController'
  }

});