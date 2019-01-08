var videoIdCounter=0;

app.directive('video', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            var video = element[0];
            var videoBox = element.closest('.video-box');
            var spinnerTemplate = '<span class="spinner"></span>';
            var videoBarTemplate = '<div class="video-bar"><div class="video-muted on"></div><div class="video-time"></div></div>';

            var isPlaying = false; // if video is playing or preparing for playing

            var videoId = videoIdCounter++;

            videoBox.append(videoBarTemplate);

            var timeoutHandler;

            var dummyHandler=function() {

            };

            function playVideo() {
                if (!isPlaying) {
                    isPlaying=true;
                    timeoutHandler=$timeout(function(){
                        //video.load();
                        //console.log('video: '+videoId+" play");
                        video.play().then(dummyHandler,dummyHandler);
                        videoBox.find('.video-bar').fadeIn();
                    }, 300);
                }
            }

            function pauseVideo() {
                if (isPlaying) {
                    isPlaying=false;
                    $timeout.cancel(timeoutHandler);
                    //video.src = '';
                    //console.log('video: '+videoId+" pause");
                    if (isIos()) {
                        video.pause();
                        video.currentTime = 0;
                    } else {
                        video.load();
                    }
                    video.muted = true;

                    videoBox.find('.video-muted').removeClass('off');
                    videoBox.find('.video-muted').addClass('on');
                    videoBox.find('.video-bar').fadeOut();
                }
            }

            var scrollHandler=function() {
                //console.log('scroll event');
                if (isInViewport(element)) {
                    playVideo();
                } else {
                    pauseVideo();
                }
            };

            $timeout(function() {
                if (element.is(':visible')) {
                    if (isInViewport(element)) {
                        playVideo();
                    }

                    var scrollContainer = getScrollContainer();
                    scrollContainer.bind('scroll', scrollHandler);
                }
            }, 300);

            video.addEventListener('loadstart', function (event) {
                videoBox.find('.spinner').remove();
                videoBox.append(spinnerTemplate);
            }, false);

            video.addEventListener('canplaythrough', function (event) {
                videoBox.find('.spinner').remove();
                videoBox.height(videoBox[0].clientHeight);
            }, false);

            video.addEventListener('timeupdate', function() {
                if (video.currentTime > 0) {
                    var currentSeconds = (Math.floor(video.currentTime % 60) < 10 ? '0' : '') + Math.floor(video.currentTime % 60);
                    var currentMinutes = Math.floor(video.currentTime / 60);
                    var time = currentMinutes + ":" + currentSeconds + ' / ' + Math.floor(video.duration / 60) + ":" + (Math.floor(video.duration % 60) < 10 ? '0' : '') + Math.floor(video.duration % 60);
                    videoBox.find('.video-time').show().text(time);
                    videoBox.find('.video-muted').show();
                }
            }, false);

            element.parent().on('click', function() {
                video.muted = !video.muted;
                if (video.muted) {
                    videoBox.find('.video-muted').removeClass('off').addClass('on');
                } else {
                    videoBox.find('.video-muted').removeClass('on').addClass('off');
                }
            });

            function isInViewport(elem) {
                var rect = elem[0].getBoundingClientRect();
                var html = document.documentElement;
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || html.clientHeight) &&
                    rect.right <= (window.innerWidth || html.clientWidth)
                );

            }

            function getScrollContainer() {
                var scrollContainer = $('.km-content:visible');
                if (isIos()) {
                    scrollContainer = $('.km-content:visible').data('kendoMobileScroller');
                }

                if (element.closest('#view-trollbox-list').is(':visible')) {

                    if (element.closest('#view-trollbox-list').hasClass('forum-container')) {
                        scrollContainer = element.closest('.forum-container').find('.km-content:visible');
                        if (isIos()) {
                            scrollContainer = element.closest('.forum-container').find('.km-content:visible').data('kendoMobileScroller');
                        }
                    }

                    if (element.closest('#view-trollbox-list').hasClass('video-identification-container')) {
                        scrollContainer = element.closest('.video-identification-container').find('.km-content:visible');
                        if (isIos()) {
                            scrollContainer = element.closest('.video-identification-container').find('.km-content:visible').data('kendoMobileScroller');
                        }
                    }
                }
                return scrollContainer;
            }

            function destroyVideo() {

                $timeout(function() {
                    var scrollContainer = getScrollContainer();
                    //console.log(scrollContainer.size());
                    scrollContainer.unbind('scroll', scrollHandler);
                });

                pauseVideo();
            }

            $rootScope.$on('videoIdentificationDestroy',function(event,data){
                destroyVideo();
            });

            $scope.$on('$destroy',function() {
                destroyVideo();
            });

        }
    };
});