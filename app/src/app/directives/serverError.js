app.directive('serverError', function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            serverError:'='
        },
        link: function(scope, element, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {
                ctrl.$setValidity('server', true);
                return viewValue;
            });

            scope.$watch('serverError', function(newValue,oldValue) {
                ctrl.$setValidity('server',!angular.isDefined(newValue));
            });
        }
    };
});