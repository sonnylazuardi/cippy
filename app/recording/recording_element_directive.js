app.directive('recordingElement', function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/recording/recording-element.html',
    controller: 'RecordingController'
  }
});