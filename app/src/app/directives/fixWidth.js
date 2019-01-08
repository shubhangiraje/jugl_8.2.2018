app.directive('fixWidth', function($timeout,$rootScope,$log) {
    var maxWidthCache=false;

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            function fixWidth() {
                if (!maxWidthCache) {
                    /*
                    var $firstImageBody = element.closest('.body');
                    var $scroller = element.closest('.messenger-conversation, .km-scroll-container');
                    var maxWidth = $scroller.width();

                    if ($firstImageBody.size() > 0) {
                        maxWidth -= ( parseInt($firstImageBody.css('margin-left')) + parseInt($firstImageBody.css('margin-right')) );
                        maxWidth -= ( parseInt($firstImageBody.css('padding-left')) + parseInt($firstImageBody.css('padding-right')) );
                    }

                    console.log('maxWidth: '+maxWidth);
                    */

                    // use premeasured values for performance
                    //var maxWidth=$('body').width()-(1871-1672);
                    var maxWidth=$('body').width()-(120);

                    var maxAllowedWidth=400;

                    if (maxWidth > maxAllowedWidth) {
                        maxWidth = maxAllowedWidth;
                    }

                    maxWidthCache=maxWidth;
                }

                var width=maxWidthCache;
                if ($attrs.fixImageWidth>0 && width>$attrs.fixImageWidth) width=$attrs.fixImageWidth;

                switch ($attrs.fixWidthType || 'image') {
                    case 'image':
                        element.css({width: width + 'px',height: width + 'px'});
                        break;
                    case 'audio':
                        element.css({width: width + 'px'});
                        break;
                    case 'contact':
                        element.css({width: width + 'px'});
                        break;
                    case 'text':
                        element.css({'max-width': width + 'px'});
                        break;
                }
            }

            fixWidth();
        }
    };
});
