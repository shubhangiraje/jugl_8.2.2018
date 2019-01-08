app.directive('audioPlayer', function(messengerService,$q,$interval,$log,$rootScope,$timeout) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            if(isWp()) {
                audioWp();
            } else {
                audioAndroidAndIos();
            }


            function audioWp() {

                var playerButton = element.find('.audio-player-button');
                var timeline = element.find('.audio-player-time-line')[0];
                var playhead = element.find('.audio-player-play-head')[0];
                var time = element.find('.audio-player-time');

                var duration = 0;
                var message = $scope.$eval($attrs.audioPlayer);
                var audioSrc = message.file.url;
                var audio = new Audio(audioSrc);

                playerButton.on('click', function() {
                    if (audio.paused) {
                        audio.play();
                        $(this).removeClass('play');
                        $(this).addClass('pause');
                    } else {
                        audio.pause();
                        $(this).removeClass('pause');
                        $(this).addClass('play');
                    }
                });

                function timeUpdate() {
                    var playPercent = 100 * (audio.currentTime / duration);
                    playhead.style.left = playPercent + '%';

                    var currentSeconds = (Math.floor(audio.currentTime % 60) < 10 ? '0' : '') + Math.floor(audio.currentTime % 60);
                    var currentMinutes = Math.floor(audio.currentTime / 60);

                    time.html(currentMinutes + ":" + currentSeconds + ' / ' + Math.floor(audio.duration / 60) + ":" + (Math.floor(audio.duration % 60) < 10 ? '0' : '') + Math.floor(audio.duration % 60));
                }

                audio.addEventListener('timeupdate', timeUpdate, false);

                audio.addEventListener('loadedmetadata', function () {
                    time.html("0:00" + ' / ' + Math.floor(audio.duration / 60) + ":" + (Math.floor(audio.duration % 60) < 10 ? '0' : '') + Math.floor(audio.duration % 60));
                }, false);

                audio.addEventListener('canplaythrough', function () {
                    duration = audio.duration;
                }, false);

                timeline.addEventListener('click', function(e) {
                    var offsetX = e.offsetX;
                    var newPos = (offsetX * 100)/timeline.offsetWidth;
                    playhead.style.left = newPos + "%";
                    audio.currentTime = (duration * newPos)/100;
                });

                audio.addEventListener('ended', function () {
                    playerButton.removeClass('pause');
                    playerButton.addClass('play');
                    audio.pause();
                    audio.currentTime = 0;
                    var message = $scope.$eval($attrs.audioPlayer);
                    messengerService.messageClicked(message,true);
                }, false);





            }


            function audioAndroidAndIos() {

                var media=null;
                var mediaStatus=null;
                var positionInterval=null;
                var seek = null;

                var playerButton = element.find('.audio-player-button');
                var timeline = element.find('.audio-player-time-line')[0];
                var time = element.find('.audio-player-time');
                var playhead = element.find('.audio-player-play-head');

                $rootScope.$on('pause',function(){
                    if (media) {
                        media.pause();
                    }
                });

                function successCallback() {
                    $log.debug('media success');
                }

                function errorCallback(error) {
                    $log.error('media error');
                    $log.error(error);
                }

                function positionUpdate() {
                    var message=$scope.$eval($attrs.audioPlayer);
                    if (media) {
                        media.getCurrentPosition(function (position) {
                            positionLineUpdate(position, media ? media.getDuration():(message.extra ? message.extra.duration:0));
                            $scope.$apply();
                        });
                    } else {
                        positionLineUpdate(0, message.extra ? message.extra.duration:0);
                        $scope.$apply();
                    }
                }

                function statusCallback(status) {
                    $log.debug('media status '+status);
                    mediaStatus=status;

                    if (mediaStatus==Media.MEDIA_RUNNING) {
                        if(seek) {
                            media.seekTo(seek);
                            seek = null;
                        }
                        positionInterval=$interval(positionUpdate,250);
                        playerButton.removeClass('play');
                        playerButton.addClass('pause');
                    } else {
                        playerButton.removeClass('pause');
                        playerButton.addClass('play');
                        $interval.cancel(positionInterval);
                    }

                    if (mediaStatus!=Media.MEDIA_PAUSED) {
                        positionUpdate();
                    }

                    if (mediaStatus==Media.MEDIA_STOPPED) {
                        media.release();
                        var message=$scope.$eval($attrs.audioPlayer);
                        messengerService.messageClicked(message,true);
                        media=null;
                    }
                    $scope.$apply();
                }

                function getMedia() {
                    var defer=$q.defer();

                    if (media) {
                        defer.resolve(media);
                    } else {
                        getAudioSrc().then(function (audioSrc) {
                            $log.debug(audioSrc);
                            if (!media) {
                                media = new Media(audioSrc, successCallback, errorCallback, statusCallback);
                                defer.resolve(media);
                            } else {
                                defer.reject(true);
                            }
                        });
                    }

                    return defer.promise;
                }

                function getAudioSrc() {
                    var defer=$q.defer();

                    var message=$scope.$eval($attrs.audioPlayer);
                    messengerService.checkAndLoadMessageFile(message,function(){
                        var src=message.fileEntry.nativeURL;
                        if (isIos()) {
                            src = decodeURIComponent(message.fileEntry.nativeURL.replace('file://', ''));
                        }

                        defer.resolve(src);
                    });

                    return defer.promise;
                }

                playerButton.on('click', function() {
                    $log.debug('play button click');
                    getMedia().then(function(media){
                        if (mediaStatus!=Media.MEDIA_RUNNING) {
                            messengerService.messageClicked($scope.$eval($attrs.audioPlayer));
                            media.play();
                        } else {
                            media.pause();
                        }
                    });
                });

                var message=$scope.$eval($attrs.audioPlayer);

                timeline.addEventListener('click', function(e) {
                    var newPos = (e.offsetX * 100)/timeline.offsetWidth;
                    var currentTime = null;

                    getMedia().then(function(media){
                        currentTime = ((media.getDuration()>0 ? media.getDuration() : message.extra.duration)*newPos)/100;
                        //currentTime milliseconds
                        currentTime = Math.floor(currentTime * 1000);
                        if (mediaStatus!=Media.MEDIA_RUNNING) {
                            seek = currentTime;
                        }
                        media.seekTo(currentTime);
                        positionUpdate();
                    });

                });

                function positionLineUpdate(position,duration) {

                    if(seek) {
                        position = seek/1000;
                        //seek = null;
                    }
                    if (position<0) {
                        position=0;
                    }
                    if (duration<1) {
                        duration=1;
                    }

                    var playPercent = 100 * (position / duration);
                    playhead.css('left', playPercent + '%');

                    var currentSeconds = (Math.floor(position % 60) < 10 ? '0' : '') + Math.floor(position % 60);
                    var currentMinutes = Math.floor(position / 60);

                    time.html(currentMinutes + ":" + currentSeconds + ' / ' + Math.floor(duration / 60) + ":" + (Math.floor(duration % 60) < 10 ? '0' : '') + Math.floor(duration % 60));
                }

                positionLineUpdate(0,message.extra ? message.extra.duration:0);

            }



        }

    };

});