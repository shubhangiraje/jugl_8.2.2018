app.directive('longTap', function($timeout,$log) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            var dragging = false;
            var timer = null;
            var timeTap = 1000;

            var touchStartEvent='touchstart';
            var touchEndEvent='touchend';
            var touchCancelEvent='touchcancel';
            var touchMoveEvent='touchmove';

            if (isWp()) {
                var pos = 0;
                var positionContainer = 0;

                if(window.PointerEvent) {
                    touchStartEvent='pointerDown';
                    touchEndEvent='pointerUp';
                    touchCancelEvent='pointerCancel';
                    touchMoveEvent='pointerMove';
                }else if(window.MSPointerEvent) {
                    touchStartEvent='MSPointerDown';
                    touchEndEvent='MSPointerUp';
                    touchCancelEvent='MSPointerCancel';
                    touchMoveEvent='MSPointerMove';
                }
            }

            element.on(touchMoveEvent, function(event) {
                dragging = true;
            });

            element.on(touchStartEvent,function(event){

                if (isWp()) {

                    var elem = $(this);
                    var arrClickEvent = [];
                    $.each($._data(elem[0], 'events'), function(i, e) {
                        if(i == 'click') {
                            arrClickEvent = {
                                'event': 'click',
                                'handler': e[0].handler
                            };
                        }
                    });

                    var scrollContainer = element.closest('.km-content:visible');
                    if(scrollContainer.find('.messenger-conversation').length > 0) {
                        scrollContainer = $('.messenger-conversation');
                    }

                    timer = $timeout(function(){
                        positionContainer = scrollContainer.scrollTop();
                        if(!dragging && pos==positionContainer) {
                            $scope.$eval($attrs.longTap);
                            elem.unbind('click');

                            $timeout(function() {
                                elem.on(arrClickEvent.event, arrClickEvent.handler);
                            }, 1000);

                        }
                    },timeTap);
                    dragging = false;
                    pos = scrollContainer.scrollTop();

                } else {
                    timer = $timeout(function(){
                        if(!dragging) {
                            $scope.$eval($attrs.longTap);
                        }
                    },timeTap);
                    dragging = false;
                }

            }).on(touchEndEvent+' '+touchCancelEvent, function(event){
                if (timer) $timeout.cancel(timer);
            });
        }
    };
});
