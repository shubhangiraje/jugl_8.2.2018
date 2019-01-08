app.directive('openLink', function($timeout,$rootScope) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            element.on('click', 'a', function(e) {
                var url = $(this).attr('href');
                $rootScope.openUrlInBrowser(url);
                e.preventDefault();
            });
        }
    };

});