app.directive('chatScroller', function($timeout,$log) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            var $scroller = $('.messenger-conversation', element);
            var $scrollerContainer= $('.km-scroll-container', $scroller);
            var kendoMobileScroller = $('.messenger-conversation', element).data("kendoMobileScroller");

            if ($attrs.chatScroller) {
                /*
                kendoMobileScroller.setOptions({
                    pullToRefresh: true,
                    pull: function() {
                        kendoMobileScroller.pullHandled();
                        setTimeout(function() {
                            $scope.$eval($attrs.chatScroller);
                        }, 1000);
                    }
                })
                */

                var prevScrollTop=0;

                kendoMobileScroller.bind("scroll", function(e) {
                    var scrollTop=e.scrollTop;
                    if (scrollTop<=0 && prevScrollTop>0) {
                        //messengerService.conversation.loadingMoreHistory=true;
                        //$timeout(function(){
                            //messenger.conversation.loadingMoreHistory=false;
                            $scope.$eval($attrs.chatScroller);
                        //},1500);
                    }
                    prevScrollTop=scrollTop;
                });

            }

            function scrollToBottom() {

                kendoMobileScroller.contentResized();
                //$timeout(function() {
                    //$log.debug('scrolling');
                    //$log.debug('height '+kendoMobileScroller.height());
                    //$log.debug('cheight '+kendoMobileScroller.scrollHeight());

                    if ($('.km-scroll-container', $scroller).size() > 0) {
                        var offset = $scroller.height() - $('.km-scroll-container', $scroller).outerHeight();
                        if (offset < 0)
                            kendoMobileScroller.scrollTo(0, offset);
                        else
                            kendoMobileScroller.scrollTo(0, 0);
                    } else {
                        //kendoMobileScroller.scrollTo(0, 999999);
                    }
                //},100);
            }


            var oldHeight;

            function fixImagesMaxWidth(useScrollToBottom) {
                $timeout(function() {
                    //if ($('.messenger-conversation-message .image img', $scroller).size() === 0)
                    //    return false;

                    /*
                    var $firstImageBody = $('.messenger-conversation-message .image img:first', $scroller).closest('.body');
                    var maxWidth = $scroller.width();

                    if ($firstImageBody.size()>0) {
                        maxWidth -= ( parseInt($firstImageBody.css('margin-left')) + parseInt($firstImageBody.css('margin-right')) );
                        maxWidth -= ( parseInt($firstImageBody.css('padding-left')) + parseInt($firstImageBody.css('padding-right')) );
                    }

                    if (maxWidth>400) {
                        maxWidth=400;
                    }

                    $('.messenger-conversation-message .image img', $scroller).css({width: maxWidth + 'px',height: maxWidth + 'px'});
                    */

                    if (useScrollToBottom) {
                        scrollToBottom();
                        //$timeout(scrollToBottom, 0);
                    } else {
                        //kendoMobileScroller.reset();
                        kendoMobileScroller.contentResized();
                        var scrollTo=-($('.km-scroll-container', $scroller).outerHeight()-oldHeight);
                        //console.log('old height '+oldHeight);
                        //console.log('new height '+$('.km-scroll-container', $scroller).outerHeight());
                        //console.log('scrollTo '+scrollTo);
                        $timeout(function(){kendoMobileScroller.scrollTo(0,scrollTo);},0);
                    }
                });
            }

            $scope.$on('chat.scroller.measure', function(event,data) {
                oldHeight=$('.km-scroll-container', $scroller).outerHeight();//kendoMobileScroller.scrollHeight();
                data();
            });

            $scope.$on('chat.scroller.scroll', function(event,toBottom) {
                fixImagesMaxWidth(toBottom);
            });

            $scope.$on('chat.scroller.checkLoadingMedia', function(event) {
                $('.image img', $scroller).load(function() {
                    fixImagesMaxWidth(true);
                });
            });
/*
            $scope.$on('chat.scroller.init', function(event,data) {
                fixImagesMaxWidth(!data);
            }, true);

            $scope.$on('chat.scroller.newMessage', function(event,data) {
                fixImagesMaxWidth(!data);
            }, true);
*/
        }
    };
});


app.directive('chatScrollerNative', function($timeout,$log) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            var $scroller = $('.messenger-conversation', element);

            if ($attrs.chatScrollerNative) {
                var prevScrollTop=0;

                $scroller.on('scroll',function () {
                    var scrollTop=$scroller.scrollTop();
                    if (scrollTop===0 && prevScrollTop>0) {
                        $scope.$eval($attrs.chatScrollerNative);
                    }
                    prevScrollTop=scrollTop;
                });
            }

            function scrollToBottom() {
                $scroller.scrollTop(999999);
            }

            var oldHeight;

            function fixImagesMaxWidth(useScrollToBottom) {
                $timeout(function() {
                    /*
                    var $firstImageBody = $('.messenger-conversation-message .image img:first', $scroller).closest('.body');
                    var maxWidth = $scroller.width();

                    if ($firstImageBody.size()>0) {
                        maxWidth -= ( parseInt($firstImageBody.css('margin-left')) + parseInt($firstImageBody.css('margin-right')) );
                        maxWidth -= ( parseInt($firstImageBody.css('padding-left')) + parseInt($firstImageBody.css('padding-right')) );
                    }

                    if (maxWidth>400) {
                        maxWidth=400;
                    }

                    $('.messenger-conversation-message .image img', $scroller).css({width: maxWidth + 'px',height: maxWidth + 'px'});
                    */
                    if (useScrollToBottom) {
                        $timeout(scrollToBottom, 100);
                    } else {
                        $scroller.scrollTop($scroller[0].scrollHeight-oldHeight);
                    }
                });
            }

            $scope.$on('chat.scroller.measure', function(event,data) {
                oldHeight=$scroller[0].scrollHeight;
                data();
            });

            $scope.$on('chat.scroller.scroll', function(event,toBottom) {
                fixImagesMaxWidth(toBottom);
            });

            $scope.$on('chat.scroller.fixScroll', function(event,offset) {
                $scroller.scrollTop( $scroller.scrollTop() + offset );
            });

            $scope.$on('chat.scroller.checkLoadingMedia', function(event) {
                $('.image img', $scroller).load(function() {
                    fixImagesMaxWidth(true);
                });
            });
/*
            $scope.$on('chat.scroller.init', function(event,data) {
                fixImagesMaxWidth(!data);
            }, true);

            $scope.$on('chat.scroller.newMessage', function(event,data) {
                fixImagesMaxWidth(!data);
            }, true);
*/
        }
    };
});
