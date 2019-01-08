app.directive('outFocusSwitch', function($timeout) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            element.on('click', function() {
                $(document).find('input:focus, textarea:focus').blur();
            });
        }
    };

});