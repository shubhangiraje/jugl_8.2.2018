app.directive('chatMessagesSize', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            var oldHeight = 0;

            var $scroller = $('.messenger-conversation', element);

            function calcHeight() {
                if ($(element).closest('.km-content').size() === 0)
                    return false;
                var totalHeight = $(element).closest('.km-content').height();
                var formHeight = $('.messenger-conversation-form', element).outerHeight();
                var titleHeight = 0;
                if ($('.km-view-title', element).is(':visible'))
                    titleHeight = $('.km-view-title', element).outerHeight();
                oldHeight = totalHeight - formHeight - titleHeight;
                $('.messenger-conversation', element).height(oldHeight);
                return oldHeight;
            }

            $(window).bind('resize.chatEvents', function() {
                var old = oldHeight;
                var newHeight = calcHeight();

                var offset = $scroller[0].scrollHeight;

                offset = old - newHeight;

                if ( offset < 0 )
                    offset = 0;
                
                if (offset !== 0)
                    $scope.$broadcast('chat.scroller.fixScroll', offset);
            });

            $scope.$watch('messenger.conversation.log', function() {
                calcHeight();
            }, true);

            $scope.$on('chat.resize', function() {
                calcHeight();
            });

            $scope.$on('elastic:resize',function() {
                $timeout(function() {
                    calcHeight();
                }, 1000);
            });

            $scope.$on('$destroy',function() {
                $(window).unbind('resize.chatEvents');
            });
        }
    };
});
