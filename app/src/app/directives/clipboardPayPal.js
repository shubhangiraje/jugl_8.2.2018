app.directive('clipboardPayPal', function() {
    return {
        restrict: 'A',
        link: function(scope, element, $attrs) {
            var clipData = $attrs.clipboardPayPal;
            element.on('click', function() {
                cordova.plugins.clipboard.copy(clipData);
            });
        }
    };
});