app.controller('SearchRequestDraftUpdateCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $rootScope, $interval,
                                                 $timeout, modal, ChatUploader, uploadService, $log,gettextCatalog,$cordovaCamera) {

    if (!$scope.data) {
        $scope.data={
            searchRequest: {},
            chatUploader: ChatUploader(['avatarBig']),
            chatUploadOptions: {
                onSuccess: function(response,status,headers) {
                    $scope.data.searchRequest.files.push(response);
                    $log.debug('fileupload completed successfully');
                },
                onError:function() {
                    modal.error(gettextCatalog.getString('Upload error. Please try again'));
                    $log.error('fileupload error');
                }
            },
            useFileInput: !isCordova(),
            fileUpload: true,
            isSaveDraft: false
        };

        var intervalSaveDraft = null;

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);

            $scope.data.searchRequest = {};
            var ids='';

            if(kendoEvent.view.params.ids) {
                ids = kendoEvent.view.params.ids;
                $scope.data.isSaveDraft = true;
            }

            $scope.data.draft_id = kendoEvent.view.params.id;

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-search-request-draft/get', {id: $scope.data.draft_id, ids: ids})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        if(ids) {
                            angular.extend($scope.data.searchRequest, $rootScope.oldSearchRequestAddData);
                        }

                        if($scope.data.searchRequest.searchRequestInterests[0].level2Interest.search_request_bonus) {
                            $scope.data.searchRequest.bonus_interest = $scope.data.searchRequest.searchRequestInterests[0].level2Interest.search_request_bonus;
                        } else {
                            $scope.data.searchRequest.bonus_interest = $scope.data.searchRequest.searchRequestInterests[0].level1Interest.search_request_bonus;
                        }

                        if(!$scope.data.searchRequest.bonus_interest) {
                            $scope.data.searchRequest.bonus_interest = 1;
                        }

                        intervalSaveDraft=$interval(function(){
                            if($scope.data.isSaveDraft) {
                                jsonPostDataPromise('/ext-api-search-request-draft/update', {id: $scope.data.draft_id, searchRequest: $scope.data.searchRequest}).then(function (res) {});
                                $scope.data.isSaveDraft = false;
                            }
                        },10*1000);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });

        };

        $scope.data.addInterests = function() {
            $rootScope.oldSearchRequestAddData = angular.copy($scope.data.searchRequest);
            delete $rootScope.oldSearchRequestAddData.searchRequestInterests;
            delete $rootScope.oldSearchRequestAddData.searchRequestParamValues;
            delete $rootScope.oldSearchRequestAddData.$allErrors;
            delete $rootScope.oldSearchRequestAddData.$errors;
            kendo.mobile.application.navigate('view-interests-addstep1.html?type=updateDraftSearch&draft_id='+$scope.data.searchRequest.draft_id);
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
                                    $scope.data.searchRequest.files.push(data);
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
                        $scope.data.searchRequest.files.push(data);
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

        $scope.data.deleteFile = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchten Sie diese bild löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                for (var i in $scope.data.searchRequest.files) {
                    if ($scope.data.searchRequest.files[i].id == id) {
                        $scope.data.searchRequest.files.splice(i, 1);
                        break;
                    }
                }
            });
        };

        $scope.data.save = function() {
            $scope.data.isSaveDraft = false;
            $scope.data.searchRequest.saving = true;
            kendo.mobile.application.showLoading();

            jsonPostDataPromise('/ext-api-search-request/save', {
                searchRequest: $scope.data.searchRequest,
                draftId: $scope.data.draft_id
            }).then(
                function (res) {
                    $scope.data.searchRequest.saving = false;
                    kendo.mobile.application.hideLoading();

                    if (res.result===true) {
                        $interval.cancel(intervalSaveDraft);
                        modal.alert(
                            res.willBeValidated ?
                                gettextCatalog.getString('Dein Suchauftrag wurde gespeichert und wird nun durch unser Team geprüft. Wenn Dein Suchauftrag angenommen oder abgelehnt wird, erhälst Du eine Benachrichtigung')
                                :
                                gettextCatalog.getString('Du hast Deine Suchanzeige erfolgreich erstellt. Du findest Deine Anzeige unter "Suchauftrag -> Was wird mir angeboten"')
                        );
                        kendo.mobile.application.navigate('view-searches-details.html?id=' + res.searchRequest.id);
                        return;
                    }

                    if (angular.isArray(res.searchRequest.$allErrors) && res.searchRequest.$allErrors.length > 0) {
                        $scope.data.searchRequest.saving = false;
                        $scope.data.searchRequest.$errors = res.searchRequest.$errors;
                        modal.showErrors(res.searchRequest.$allErrors, gettextCatalog.getString('Fehler'));
                        return;
                    }
                },

                function() {
                    $scope.data.searchRequest.saving = false;
                    kendo.mobile.application.hideLoading();
                }
            );
        };

        $scope.$watch('data.searchRequest',function(newValue, oldValue) {
            if (newValue!=oldValue) {
                if(!$scope.data.searchRequest.saving) {
                    $scope.data.isSaveDraft = true;
                }
            }
        }, true);

        $scope.data.onHide = function(kendoEvent) {
            $interval.cancel(intervalSaveDraft);
        };

    }
});
