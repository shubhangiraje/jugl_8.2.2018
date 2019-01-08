app.directive('onChange', function() {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            element.on('keyup keydown', function() {
                $scope.$eval($attrs.onChange,{val:element.val()});
            });

        }
    };

});