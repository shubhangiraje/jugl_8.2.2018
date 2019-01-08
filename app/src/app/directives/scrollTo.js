app.directive('scrollTo', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            element.on('click', function(){
                $timeout(function() {
                    var scrollTo = $($attrs.scrollTo)[0].offsetTop;
                    $('.km-content:visible').data('kendoMobileScroller').scrollTo(0, -(scrollTo));
                }, 300);
            });
        }
    };
});