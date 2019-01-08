app.controller('InfoPopupCtrl', function ($scope,$rootScope,jsonDataPromise,jsonPostDataPromise,modal,$timeout,uploadService,status,gettextCatalog,$cordovaActionSheet,$cordovaCamera,$log, $cordovaFile, $cordovaFileTransfer) {

    if (!$scope.data) {
		var set_country_to_user=false;
        $scope.data = $rootScope.infoPopupData;

        $scope.data.infoComment = {
            newComment: {
                fileUpload: true
            },
            loading: false
        };

        //$scope.data.infoComments.countryWikiArray=[];

        $scope.data.infoComments.loading = false;
        $scope.data.infoComments.pageNum = 1;
        $scope.data.infoComments.sort = 'votes_up';
        $scope.data.fileUpload=true;

        $scope.data.countryId = $scope.data.currentCountry[0].id;

		//updateCountryList();

        $scope.data.sortComment=function (field) {
            $scope.data.infoComments.sort=field;
        };

        $scope.$watch('data.infoComments.sort',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.infoComments.refresh();
            }
        },true);

        $scope.data.infoCommentUploadImage = function() {
            uploadService.run(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE)
                .then(
                    function(file) {
                        $scope.data.infoComment.newComment.image = file.thumbs.infoCommentSmall;
                        $scope.data.infoComment.newComment.file_id = file.id;
                    },
                    function(error) {
                    }
                );
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
                $scope.data.fileUpload=false;
                uploadService.upload({
                    uri: uri,
                    mediaType: mediaType
                }).then(
                    function(data) {
                        $scope.data.infoComment.newComment.image = data.thumbs.infoCommentSmall;
                        $scope.data.infoComment.newComment.file_id = data.id;
                        $scope.data.fileUpload=true;
                        $log.debug('Upload succes!');
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });
        }
        /*jshint +W082 */


        $scope.data.infoCommentUpload = function() {
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
        };

        $scope.data.addComment=function() {
            if(status.user.packet == 'VIP' || status.user.packet == 'VIP_PLUS') {
                $timeout(function(){
                    kendo.mobile.application.showLoading();
                    jsonPostDataPromise('/ext-api-info/add-comment', {
                        infoComment: $scope.data.infoComment.newComment,
                        infoPopupData: $scope.data.info,
                        country_id:$scope.data.countryId
                    }).then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if(data.infoComment.$allErrors.length===0) {
                            $scope.data.infoComment.newComment={};
                            $scope.data.infoComments.pageNum = 1;
                            angular.extend($scope.data.infoComments, data.infoComments);
                            //updateCountryList();
                        } else {
                            modal.showErrors(data.infoComment.$allErrors);
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
                });
            } else {
                modal.alert({message: gettextCatalog.getString('Leider hast Du keine Premium-Mitgliedschaft um diese Funktion nutzen zu können.')});
            }
        };

        $scope.data.infoComments.refresh=function() {
            $scope.data.infoComments.pageNum=1;
            $scope.data.infoComments.hasMore=false;
            $scope.data.infoComments.load();
        };

        $scope.data.infoComments.loadMore=function() {
            var data=$scope.data.infoComments;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.infoComments.load = function() {
            var data=$scope.data.infoComments;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-info/list-comments', {
                info_id: $scope.data.info.id,
                country_id:$scope.data.countryId,
                pageNum: data.pageNum,
                sort: data.sort
            }).then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);
					angular.extend($scope.data.info, res.info);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        function commentVote(id,vote) {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-info/vote-comment', {id: id, vote: vote})
                .then(function (res) {
                    kendo.mobile.application.hideLoading();
                    if(res.comment) {
                        for(var idx in $scope.data.infoComments.items) {
                            if ($scope.data.infoComments.items[idx].id==res.comment.id) {
                                $scope.data.infoComments.items[idx]=res.comment;
                            }
                        }
                    }
                    modal.alert({message:res.result});
                },function(){
                    kendo.mobile.application.hideLoading();
                });
        }

        $scope.data.commentVoteUp=function(id) {
            commentVote(id,1);
        };

        $scope.data.commentVoteDown=function(id) {
            commentVote(id,-1);
        };

        $scope.data.viewVotes=function(id) {
            $rootScope.infoPopup.showVotes=false;
            jsonDataPromise('/ext-api-info/votes-comment',{id:id})
                .then(function(data){
                    $rootScope.infoVotes=data;
                    $rootScope.infoPopup.showVotes=true;
                    $timeout(function() {
                        $('#view-votes-info-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('infoPopupVotesResize');
                        }, 50);
                    });
                });
        };


        $rootScope.$on('infoPopupResize',function() {

            var container = $('#view-info-popup').closest('.k-animation-container');
            var contentHeight = $('#view-info-popup .info-popup-box').height();
            var padding = 2 * 10;
            var border = 2 * 1;

            var heightWindow = $(window).height();

            if (isAndroid()) {
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 60 + 'px'});
                } else {
                    container.css({height: contentHeight + padding + border + 'px'});
                }
            }

            if(isIos()){
                if(contentHeight > heightWindow) {
                    container.css({height: heightWindow - 60 + 'px'});
                }
            }

            if(isWp()) {
                $('#view-info-popup').css({overflow: 'auto'});
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 60 + 'px'});
                }
            }

        });



        $scope.data.showVideo = function(comment) {
            uploadService.showMedia(comment.file, 'VIDEO', comment.id);
        };

		$scope.labels=$rootScope.status.labels;

		$scope.$watch('data.currentCountry[0].id',function(newValue,oldValue) {
            if (newValue != oldValue) {
                $scope.data.countryId = newValue;
                $scope.data.infoComments.items=[];
                $scope.data.infoComments.refresh();
            }
		},true);

        $scope.data.commentAccept=function(comment) {
            jsonPostDataPromise('/ext-api-info/accept-comment', {id: comment.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.infoComments.items) {
                            if ($scope.data.infoComments.items[idx].id==comment.id) {
                                $scope.data.infoComments.items[idx]=res.infoComment;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.commentReject=function(comment) {
            jsonPostDataPromise('/ext-api-info/reject-comment', {id: comment.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.infoComments.items) {
                            if ($scope.data.infoComments.items[idx].id==comment.id) {
                                $scope.data.infoComments.items[idx]=res.infoComment;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.onClose = function(kendoEvent) {
            $rootScope.$broadcast('videoIdentificationDestroy', true);
        };


    }


});