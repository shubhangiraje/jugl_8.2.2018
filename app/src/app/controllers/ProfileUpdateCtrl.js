app.controller('ProfileUpdateCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,$rootScope,$timeout,$interval,status,uploadService,ChatUploader,modal,gettextCatalog,$log) {

    if (!$scope.data) {
		
        $scope.data={
            fileUpload: true,
            validation_code_success: false
        };
		
		var timer;
		$scope.data.new_code_interval = 0;

        $scope.data.onShow = function(kendoEvent) {
            kendoEvent.view.scroller.scrollTo(0, 0);
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-profile/index')
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                if (kendoEvent.view.params['scroll-to-validation-phone']) {
                    $timeout(function() {
                        var scroller=$('.km-content:visible').data('kendoMobileScroller');
                        var scrollTo = $('#validationPhone').position().top;
                        scroller.scrollTo(0,-scrollTo);
                    });
                }
            });
        };

        $scope.data.uploadImage = function() {
            uploadService.run(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE)
                .then(
                function(file) {
                    $scope.data.user.avatarFile.thumbs.avatarMobile = file.thumbs.avatarMobile;
                    $scope.data.user.avatar_file_id = file.id;
                },
                function(error) {
                }
            );
        };


        $scope.data.save = function() {

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-profile/save-profile', {user: $scope.data.user})
                    .then(function (res) {
                        if (res.result) {
                            status.update();
                            kendo.mobile.application.hideLoading();
                            // kendo.mobile.application.navigate('view-profile.html');
                            kendo.mobile.application.navigate('view-user-profile.html?id='+status.user.id);
                        } else {
                            modal.showErrors(res.user.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }

                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        /*jshint -W083 */
        $scope.data.uploadPhotos = function() {

            var sourceType=Camera.PictureSourceType.PHOTOLIBRARY;
            var mediaType=Camera.MediaType.PICTURE;

            if (sourceType==Camera.PictureSourceType.PHOTOLIBRARY && mediaType==Camera.MediaType.PICTURE && !isWp()) {
                window.imagePicker.getPictures(
                    function(results) {
                        if (results.length===0) return;
                        for(var idx in results) {
                            $scope.data.fileUpload = false;
                            uploadService.upload({
                                uri: results[idx],
                                mediaType: mediaType
                            }).then(
                                function(data) {
                                    $scope.data.user.photos.push(data);
                                    $log.debug('Upload succes!');
                                    $scope.data.fileUpload = true;
                                },
                                function(error) {
                                    $log.error('Upload error: ' + error);
                                }
                            );
                        }

                    }, function (error) {
                        $log.error('Error: ' + error);
                    }, {
                        maximumImagesCount: 30,
                        width: 1280,
                        height: 1280,
                        quality: 70
                    }
                );

                return;
            }

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
                $scope.data.fileUpload = false;
                uploadService.upload({
                    uri: uri,
                    mediaType: mediaType
                }).then(
                    function(data) {
                        $scope.data.user.photos.push(data);
                        $log.debug('Upload succes!');
                        $scope.data.fileUpload = true;
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });

        };
        /*jshint +W083 */

        $scope.data.deletePhoto = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchten Sie diese bild löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                for (var i in $scope.data.user.photos) {
                    if ($scope.data.user.photos[i].id == id) {
                        $scope.data.user.photos.splice(i, 1);
                        break;
                    }
                }
            });
        };


        $scope.data.autoSave = function() {
            $timeout(function(){
                jsonPostDataPromise('/ext-api-profile/auto-save-profile', {user: $scope.data.user})
                    .then(function (res) {
                        if (res.result) {
                            status.update();
                        }
                    },function(){});
            });
        };


        $scope.$watch('data.user',function(new_value, old_value) {
            if ((new_value != old_value) && old_value) {
                if(new_value.email == old_value.email &&
                    new_value.oldPassword == old_value.oldPassword &&
                    new_value.newPassword == old_value.newPassword &&
                    new_value.newPasswordRepeat == old_value.newPasswordRepeat &&
                    new_value.company_name == old_value.company_name &&
                    new_value.company_manager == old_value.company_manager &&
                    new_value.impressum == old_value.impressum &&
                    new_value.agb == old_value.agb &&
                    new_value.validation_phone == old_value.validation_phone &&
                    new_value.validation_code_form == old_value.validation_code_form &&
                    new_value.validation_phone_status == old_value.validation_phone_status &&
                    new_value.is_company_name == old_value.is_company_name ) {

                    $scope.data.autoSave();
                }
            }
        }, true);



        $scope.data.sendValidationPhone = function() {
			$scope.data.sendingSms=true;
			jsonPostDataPromise('/ext-api-profile/send-validation-phone', {validation_phone: $scope.data.user.validation_phone}).
            then(function(data) {
                    $scope.data.sendingSms=false;
                    if(data.result === true) {
                        $scope.data.user.validation_phone_status = data.validation.validation_phone_status;
                    } else {
                        modal.showErrors(data.validation.$allErrors);
						
                    }
					$scope.data.callTimeoutButtonValidation();
                },function(error) {
                    $scope.data.sendingSms=false;
                }
            );
        };

        $scope.data.sendValidationCode = function() {
		$scope.data.code_clicked=true;	
            jsonPostDataPromise('/ext-api-profile/send-validation-code', {validation_code_form: $scope.data.user.validation_code_form}).
                then(function(data) {
                    if(data.result === true) {
                        $scope.data.validation_code_success = true;
                    } else {
                        modal.showErrors(data.validation.$allErrors);
						$scope.data.code_clicked=false;
                    }
                }
            );
        };
		
		$scope.data.callTimeoutButtonValidation=function(){
			$scope.data.new_code_interval=20;
			timer=$interval( function(){
			$scope.data.new_code_interval--;
				if ($scope.data.new_code_interval===0) {
				    $interval.cancel(timer);
				}
			},1000);
		};
	


    }

});