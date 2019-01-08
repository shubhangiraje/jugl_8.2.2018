app.directive('fieldsScroll', function($timeout) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            function scrollerTop(el) {
                var scroller= $('.km-content:visible').data('kendoMobileScroller'),
                    offsetTop = el.offset().top,
                    offsetContainer = $('.km-content:visible').scrollTop(),
                    pos = 150-(offsetContainer+offsetTop);

                if(pos<0) {
                    scroller.animatedScrollTo(0, pos);
                }
            }

            if(isAndroid()) {
                element.on('click', 'input[type=text], textarea, input[type=number], input[type=password]' , function () {
                    var el = $(this);
                    $timeout(function () {
                        scrollerTop(el);
                    }, 350);

                });
            }

        }
    };

});