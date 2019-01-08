app.controller('SearchRequestOfferAddCtrl', function ($scope, jsonDataPromise, jsonPostDataPromise, $rootScope, $timeout, modal, uploadService, $cordovaCamera, gettextCatalog, $log) {

    if (!$scope.data) {
        $scope.data={
            searchRequestOffer: {
                saving: false
            },

            offerParamValuesListViewOptions: {
                template: $('#template-offer-param-list').html(),
                dataSource: new kendo.data.DataSource({
                    data: []
                })
            },

            fileUpload: true,
            fileUploadDetails: true
        };

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);

            $scope.data.searchRequestOffer = {
                saving: false
            };

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-search-request-offer/add',{searchRequestId:kendoEvent.view.params.id})
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        var searchRequestOfferParamValues = [];
                        for(var i in res.searchRequestOffer.searchRequestOfferParamValues) {
                            if(res.searchRequestOffer.searchRequestOfferParamValues[i].value) {
                                searchRequestOfferParamValues.push(res.searchRequestOffer.searchRequestOfferParamValues[i]);
                            }
                        }

                        //$scope.data.offerParamValuesListViewOptions.dataSource.data(res.searchRequestOffer.searchRequestOfferParamValues);
                        $scope.data.offerParamValuesListViewOptions.dataSource.data(searchRequestOfferParamValues);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.getParamIndex = function(id) {
            var i,
                len = $scope.data.searchRequestOffer.searchRequestOfferParamValues.length;
            for (i = 0; i < len; i++) {
                if ($scope.data.searchRequestOffer.searchRequestOfferParamValues[i].id == id) {
                    return i;
                }
            }
        };


        /*jshint -W083 */
        $scope.data.uploadImage = function() {

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
                                    $scope.data.searchRequestOffer.files.push(data);
                                    $scope.data.fileUpload = true;
                                    $log.debug('Upload succes!');
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
                        $scope.data.searchRequestOffer.files.push(data);
                        $scope.data.fileUpload = false;
                        $log.debug('Upload succes!');
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });

        };

        /*jshint +W083 */

        /*jshint -W083 */
        $scope.data.detailsUploadImage = function() {

            var sourceType=Camera.PictureSourceType.PHOTOLIBRARY;
            var mediaType=Camera.MediaType.PICTURE;

            if (sourceType==Camera.PictureSourceType.PHOTOLIBRARY && mediaType==Camera.MediaType.PICTURE && !isWp()) {
                window.imagePicker.getPictures(
                    function(results) {
                        if (results.length===0) return;
                        for(var idx in results) {
                            $scope.data.fileUploadDetails = false;
                            uploadService.upload({
                                uri: results[idx],
                                mediaType: mediaType
                            }).then(
                                function(data) {
                                    $scope.data.searchRequestOffer.details_files.push(data);
                                    $scope.data.fileUploadDetails = true;
                                    $log.debug('Upload succes!');
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
                $scope.data.fileUploadDetails = false;
                uploadService.upload({
                    uri: uri,
                    mediaType: mediaType
                }).then(
                    function(data) {
                        $scope.data.searchRequestOffer.details_files.push(data);
                        $scope.data.fileUploadDetails = true;
                        $log.debug('Upload succes!');
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });

        };
        /*jshint +W083 */

        $scope.data.deleteFile = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchten Sie diese bild löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                for (var i in $scope.data.searchRequestOffer.files) {
                    if ($scope.data.searchRequestOffer.files[i].id == id) {
                        $scope.data.searchRequestOffer.files.splice(i, 1);
                        break;
                    }
                }
            });
        };

        $scope.data.detailsDeleteFile = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchten Sie diese bild löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                for (var i in $scope.data.searchRequestOffer.details_files) {
                    if ($scope.data.searchRequestOffer.details_files[i].id == id) {
                        $scope.data.searchRequestOffer.details_files.splice(i, 1);
                        break;
                    }
                }
            });
        };

        $scope.data.saveOffer = function () {
            $scope.data.searchRequestOffer.saving = true;
            kendo.mobile.application.showLoading();

            jsonPostDataPromise('/ext-api-search-request-offer/save', {searchRequestOffer: $scope.data.searchRequestOffer})
                .then(
                    function (res) {
                        $scope.data.searchRequestOffer.saving = false;
                        kendo.mobile.application.hideLoading();

                        if (res.result===true) {
                            modal.alert(gettextCatalog.getString('Du hast ein Angebot auf diese Suchanzeige erfolgreich abgegeben!'));
                            kendo.mobile.application.navigate('view-searches-details.html?id=' + $scope.data.searchRequestOffer.search_request_id);
                            return;
                        }

                        if (angular.isArray(res.searchRequestOffer.$allErrors) && res.searchRequestOffer.$allErrors.length > 0) {
                            $scope.data.searchRequestOffer.saving = false;
                            modal.showErrors(res.searchRequestOffer.$allErrors, gettextCatalog.getString('Fehler'));
                            return;
                        }
                    },

                    function() {
                        $scope.data.searchRequestOffer.saving = false;
                        kendo.mobile.application.hideLoading();
                    }
                );
        };
    }
});
