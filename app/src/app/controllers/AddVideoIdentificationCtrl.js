app.controller('AddVideoIdentificationCtrl', function ($scope, $log, uploadService, modal, jsonDataPromise, jsonPostDataPromise, status, gettextCatalog,$timeout) {

    function recordIdentVideo() {
        $scope.data.recordedVideoSrs = null;
        $scope.data.recorded = false;

        window.plugins.videocaptureplus.captureVideo(
            function(data) {
                var uri=data[0].fullPath;
                if (isIos()) {
                    uri='file://'+uri;
                }
                $scope.data.recorded = true;
                $scope.data.recordedVideoSrs = uri;
                $timeout(function() {
                    kendo.mobile.application.view().scroller.scrollTo(0, 0);
                });
            },
            function(err) {
                $scope.data.recorded = false;
                $scope.data.recordedVideoSrs = null;
                $log.error(err);
            },
            {
                limit: 1,
                duration: 60,
                highquality: false,
                frontcamera: true
            }
        );
    }

    if(!$scope.data) {

        $scope.data = {
            trollboxMessage:{},
            recorded: false,
            fileUpload: false,
            recordedVideoSrs: null,
            uploadSuccess: false,
            termOfUse: false
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.trollboxMessage = {};
            $scope.data.recorded = false;
            $scope.data.recordedVideoSrs = null;
            $scope.data.termOfUse = false;
            $scope.data.uploadSuccess = false;
            $scope.data.fileUpload = false;
        };

        $scope.data.record = function() {
            jsonDataPromise('/ext-api-trollbox-new2/send-video-identification-precheck')
                .then(function (res) {
                    if (res.message) {
                        if (res.mustPay) {
                            modal.confirmYesCancel({message:res.message}).then(function(res) {
                                if (res==1) {
                                    jsonPostDataPromise('/ext-api-trollbox-new2/send-video-identification-pay').then(function(res) {
                                        if (res.message) {
                                            modal.alert({message:res.message});
                                        } else {
                                            recordIdentVideo();
                                        }
                                    });
                                }
                            });
                        } else {
                            modal.alert({message:res.message});
                        }
                        return;
                    }

                    recordIdentVideo();
                });
        };

        $scope.data.save = function() {
            $scope.data.fileUpload=true;

            uploadService.upload({
                uri: $scope.data.recordedVideoSrs,
                mediaType: Camera.MediaType.VIDEO
            }).then(
                function(data) {

                    if (data.ext!=='mp4') {
                        modal.alert({message:gettextCatalog.getString('Dein Video wurde in einem fehlerhaften Format aufgenommen und wird deswegen nicht veröffentlicht. Bitte erneut versuchen')});
                        $scope.data.fileUpload=false;
                        return;
                    }

                    if (data.codec=='h263' || data.codec=='mpeg4') {
                        modal.alert({message:gettextCatalog.getString('Dein Video wurde in einem fehlerhaften Format aufgenommen und wird deswegen nicht veröffentlicht. Bitte erneut versuchen')});
                        $scope.data.fileUpload=false;
                        return;
                    }

                    $scope.data.trollboxMessage.file_id = data.id;
                    jsonPostDataPromise('/ext-api-trollbox-new2/send-video-identification', {trollboxMessage:  $scope.data.trollboxMessage})
                        .then(function (res) {
                            if(res.trollboxMessage.$allErrors.length===0) {
                                $scope.data.trollboxMessage.id = res.trollboxMessage.id;
                                $scope.data.uploadSuccess=true;
                                $scope.data.fileUpload=false;
                                status.update();
                            } else {
                                modal.showErrors(res.trollboxMessage.$allErrors);
                            }
                        },function(){
                            $scope.data.fileUpload=false;
                        });
                    $scope.data.fileUpload=false;
                    $log.debug('Upload succes!');
                },
                function(error) {
                    $scope.data.fileUpload=false;
                    $log.error('Upload error: ' + error);
                }
            );
        };




        /*
        $scope.data.record = function() {
            if (status.user.video_identification_unloads==3 || !status.user.can_upload_video_identification) {
                modal.alert({message:gettextCatalog.getString('Du darfst nur ein Videoident innerhalb der 24 Stunden starten. Du darfst maximal 3 Videoidents machen.')});
                return;
            }

            window.plugins.videocaptureplus.captureVideo(
                function(data) {
                    var uri=data[0].fullPath;
                    if (isIos()) {
                        uri='file://'+uri;
                    }
                    $scope.data.fileUpload=true;
                    uploadService.upload({
                        uri: uri,
                        mediaType: Camera.MediaType.VIDEO
                    }).then(
                        function(data) {
                            $scope.data.trollboxMessage.file_id = data.id;
                            jsonPostDataPromise('/ext-api-trollbox-new2/send-video-identification', {trollboxMessage:  $scope.data.trollboxMessage})
                                .then(function (res) {
                                    if(res.trollboxMessage.$allErrors.length===0) {
                                        $scope.data.trollboxMessage.id = res.trollboxMessage.id;
                                        $scope.data.uploadSuccess=true;
                                        $scope.data.fileUpload=false;
                                        $scope.data.isRewrite = true;
                                        status.update();
                                    } else {
                                        modal.showErrors(res.trollboxMessage.$allErrors);
                                    }
                                },function(){
                                    $scope.data.fileUpload=false;
                                });
                            $scope.data.fileUpload=false;
                            $log.debug('Upload succes!');
                        },
                        function(error) {
                            $scope.data.fileUpload=false;
                            $log.error('Upload error: ' + error);
                        }
                    );
                },
                function(err) {
                    $log.error(err);
                },
                {
                    limit: 1,
                    duration: 60,
                    highquality: false,
                    frontcamera: true
                }
            );
        };
        */

        /*$scope.data.rewrite = function() {
            window.plugins.videocaptureplus.captureVideo(
                function(data) {
                    var uri=data[0].fullPath;
                    if (isIos()) {
                        uri='file://'+uri;
                    }
                    $scope.data.fileUpload=true;
                    uploadService.upload({
                        uri: uri,
                        mediaType: Camera.MediaType.VIDEO
                    }).then(
                        function(data) {
                            $scope.data.trollboxMessage.file_id = data.id;
                            jsonPostDataPromise('/ext-api-trollbox-new2/rewrite-video-identification', {trollboxMessage:  $scope.data.trollboxMessage})
                                .then(function (res) {
                                    if(res.trollboxMessage.$allErrors.length===0) {
                                        $scope.data.uploadSuccess=true;
                                        $scope.data.fileUpload=false;
                                        $scope.data.isRewrite = false;
                                        status.update();
                                    } else {
                                        modal.showErrors(res.trollboxMessage.$allErrors);
                                    }
                                },function(){
                                    $scope.data.fileUpload=false;
                                });
                            $scope.data.fileUpload=false;
                            $log.debug('Upload succes!');
                        },
                        function(error) {
                            $scope.data.fileUpload=false;
                            $log.error('Upload error: ' + error);
                        }
                    );
                },
                function(err) {
                    $log.error(err);
                },
                {
                    limit: 1,
                    duration: 60,
                    highquality: false,
                    frontcamera: true
                }
            );
        };
*/
        /*$scope.data.onHide = function(kendoEvent) {
            $scope.data.isRewrite = false;
        };*/
    }

    status.update();
});
