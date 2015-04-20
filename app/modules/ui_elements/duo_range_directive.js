app.directive('duoRange', ['$compile', 'EditorConfig',
    function($compile, EditorConfig) {

  return {
    restrict: 'A',
    templateUrl: 'partials/ui_elements/duo_range.html',
    link: function(scope, element, attrs){
      var setWidth = function(){
        element.css('width', scope.rangeWidth + 'px');
      };
      scope.$watch('rangeWidth', setWidth);
      setWidth();
    }
  }
}]);