
app.directive('photoSwipes', function($compile, $http, $templateCache, $timeout) {

    return {
        restrict: 'AE',
        replace: true,
        link: linkFn
    };

    function linkFn($scope, element, attrs) {
        $scope.open = function(){
            var pswpElement = document.querySelectorAll('.pswp')[0];
            var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default || false,
                $scope.$eval(attrs.slides),
                $scope.$eval(attrs.options));
            gallery.init();

            $scope.$eval(attrs.currentItem + " = currentItem",{currentItem:gallery.currItem});

            gallery.listen('beforeChange', function() {
                $scope.$eval(attrs.currentItem + " = currentItem",{currentItem:gallery.currItem});
            });

        };

        $scope.open();



    }

});

