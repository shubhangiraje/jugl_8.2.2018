app.controller('TrollboxMessageUpdateCtrl', function (status,modal,$rootScope,$scope,gettextCatalog,jsonDataPromise,jsonPostDataPromise,$cordovaGeolocation,$cordovaSpinnerDialog,$timeout,uploadService,$cordovaCamera,$cordovaActionSheet,$log) {

    if (!$scope.data) {

        $scope.data = {
            trollboxMessage: {},
            fileUpload: false
        };

        $scope.data.onOpen = function(kendoEvent) {
            var id = kendoEvent.target.attr('data-id');

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-trollbox/get-message', {id: id})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });

        };

        $scope.data.save = function() {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-trollbox/save', {trollboxMessage: $scope.data.trollboxMessage})
                .then(function (data) {
                    kendo.mobile.application.hideLoading();
                    if (angular.isArray(data.trollboxMessage.$allErrors) && data.trollboxMessage.$allErrors.length > 0) {
                        $scope.data.trollboxMessage.$errors = data.trollboxMessage.$errors;
                        modal.showErrors(data.trollboxMessage.$allErrors, gettextCatalog.getString('Fehler'));
                        return;
                    } else {
                        $rootScope.$broadcast('trollboxMessageUpdateData', data);
                        $('#view-trollbox-message-update-popup').kendoMobileModalView('close');
                    }
                },function(){
                    kendo.mobile.application.hideLoading();
                });
        };

        /*jshint -W082 */
        function sendPicture(sourceType,mediaType) {

            $cordovaCamera.getPicture({
                quality: mediaType==Camera.MediaType.PICTURE ? 70:30,
                allowEdit: mediaType==Camera.MediaType.VIDEO,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: sourceType,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: mediaType==Camera.MediaType.PICTURE ? 1280:480,
                targetHeight: mediaType==Camera.MediaType.PICTURE ? 1280:480,
                saveToPhotoAlbum: false,
                mediaType: mediaType
            }).then(function(uri){
                $scope.data.fileUpload=true;
                uploadService.upload({
                    uri: uri,
                    mediaType: mediaType
                }).then(
                    function(data) {
                        $scope.data.trollboxMessage.image = data.thumbs.trollboxSmall;
                        $scope.data.trollboxMessage.file_id = data.id;
                        $scope.data.fileUpload=false;
                        $log.debug('Upload succes!');
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });
        }
        /*jshint +W082 */

        function sendGallery() {
            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Senden'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Bilder'),
                    gettextCatalog.getString('Videos')
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                switch(btnIndex) {
                    case 1:
                        sendPicture(Camera.PictureSourceType.PHOTOLIBRARY,Camera.MediaType.PICTURE);
                        break;
                    case 2:
                        sendPicture(Camera.PictureSourceType.PHOTOLIBRARY,Camera.MediaType.VIDEO);
                        break;
                }
            });
        }

        function sendVideo() {
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
                            $scope.data.trollboxMessage.image = data.thumbs.trollboxSmall;
                            $scope.data.trollboxMessage.file_id = data.id;
                            $scope.data.fileUpload=false;
                            $log.debug('Upload succes!');
                        },
                        function(error) {
                            $log.error('Upload error: ' + error);
                        }
                    );
                },
                function(err) {
                    $log.error(err);
                },
                {
                    limit: 1,
                    duration: 120,
                    highquality: false,
                    frontcamera: false
                }
            );

        }

        function sendGeolocation() {
            $cordovaSpinnerDialog.show(gettextCatalog.getString('Nachricht Verschiken'),gettextCatalog.getString('Retrieving geolocation'),true);

            $cordovaGeolocation.getCurrentPosition({
                timeout: 60*1000,
                maximumAge: 60*1000,
                enableHighAccuracy: true
            }).then(function(position) {
                var urlPosition = 'https://www.google.com/maps/place/'+position.coords.latitude+','+position.coords.longitude;

                if($scope.data.trollboxMessage.text===undefined) {
                    $scope.data.trollboxMessage.text = urlPosition+' ';
                } else {
                    $scope.data.trollboxMessage.text = $scope.data.trollboxMessage.text + ' ' + urlPosition + ' ';
                }

                $cordovaSpinnerDialog.hide();
            },function(err) {
                $cordovaSpinnerDialog.hide();
                modal.error(gettextCatalog.getString("Can't retrieve geolocation:"+' '+err.message));
                $log.error("Can't retrieve geolocation");
                $log.error(err);
            });
        }

        $scope.data.sendSomething=function() {
            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Senden'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Galerie'),
                    gettextCatalog.getString('Photo Aufnehmen'),
                    gettextCatalog.getString('Video Aufnehmen'),
                    gettextCatalog.getString('Meine Geo-Position schicken')
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                switch(btnIndex) {
                    case 1:
                        sendGallery();
                        break;
                    case 2:
                        sendPicture(Camera.PictureSourceType.CAMERA,Camera.MediaType.PICTURE);
                        break;
                    case 3:
                        sendVideo();
                        break;
                    case 4:
                        sendGeolocation();
                        break;
                }
            });
        };




    }

});
