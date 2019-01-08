app.directive('bsHasClasses', [function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs, ctrl) {
            var input = element.find('input[ng-model],select[ng-model],textarea[ng-model]');

            if (input.size()>0) {
                scope.$watch(function() {
                    return input.controller('ngModel').$invalid;
                }, function(isInvalid) {
                    element.toggleClass('has-error', isInvalid);
                });
            }
        }
    };
}]);