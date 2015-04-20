app.directive('time', function() {
    return {
        restrict: 'A',
        scope: {
            number: '=number',
            format: '=format',
        },
        template: '{{formatted}}',
        link: function (scope, element) {
            scope.$watch('number', function() {
                scope.formatted = moment(scope.number).fromNow();
            });
            scope.formatted = moment(scope.number).fromNow();
        }
    }
});