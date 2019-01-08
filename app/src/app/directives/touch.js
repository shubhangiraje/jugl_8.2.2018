app.directive('touch', function($timeout) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            var touched = false;
            //console.log('touch init');

            var touchStartEvent='touchstart';
            var touchEndEvent='touchend';
            var touchCancelEvent='touchcancel';

            if (isWp()) {
                if(window.PointerEvent) {
                    touchStartEvent='pointerdown';
                    touchEndEvent='pointerup';
                    touchCancelEvent='pointercancel';
                }else if(window.MSPointerEvent) {
                    touchStartEvent='MSPointerDown';
                    touchEndEvent='MSPointerUp';
                    touchCancelEvent='MSPointerCancel';
                }
            }

            element.on(touchStartEvent,function(event){
                //console.log('touch start');
                if (touched) return;
                touched=true;
                $scope.$eval($attrs.touchStart);
            }).on(touchEndEvent,function(event){
                //console.log('touch end');
                if (!touched) return;
                touched=false;
                $scope.$eval($attrs.touchEnd);
            }).on(touchCancelEvent,function(event){
                //console.log('touch cancel');
                if (!touched) return;
                touched=false;
                $scope.$eval($attrs.touchEnd);
            });
        }
    };
});
