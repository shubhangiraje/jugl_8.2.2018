app.directive('imgSrc', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            $timeout(function() {
                var img = $(element.find('img'));
                var imgSrc = img.attr('src');
                img.attr('src', config.siteUrl+imgSrc);
            });
        }
    };
});