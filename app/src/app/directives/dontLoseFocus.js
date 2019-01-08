app.directive('dontLoseFocus', function($timeout) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            element.bind('focusout', function (e) {
                if ($scope.$eval($attrs.dontLoseFocus) || $(e.relatedTarget).hasClass('btn-send-message')) {
                    element.focus();
                }
            });

        }
    };

});
