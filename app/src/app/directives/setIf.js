// taken from https://github.com/abourget/abourget-angular
app.directive('setIf', [function () {
    return {
        transclude: 'element',
        priority: 1000,
        terminal: true,
        restrict: 'A',
        compile: function (element, attr, linker) {
            return function (scope, iterStartElement, attr) {
                iterStartElement[0].doNotMove = true;
                var expression = attr.setIf;
                var value = scope.$eval(expression);
                if (value) {
                    linker(scope, function (clone) {
                        iterStartElement.after(clone);
                    });
                }
            };
        }
    };
}]);
