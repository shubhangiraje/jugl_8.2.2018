app.controller('TrollboxCtrl', function ($scope,status,jsonDataPromise,jsonPostDataPromise,modal,$timeout,$rootScope,uploadService,gettextCatalog,$cordovaCamera,$cordovaActionSheet,$cordovaDialogs,$log,$cordovaSpinnerDialog,$cordovaGeolocation,$interval) {

    var isWatchFilter = false;

    if (!$scope.data) {

        var typeFilter={
            0:'',
            1:'VIDEO_IDENTIFICATION'
        };

        $scope.data={
            log: {
                items: [],
                hasMore: false
            },
            state: {
                loading: false,
                modifiedWhileLoading: false,
                pageNum: 1
            },
            filter: {},
            trollbox: {
                newMessage: {},
				country:{},
                loading: false
            },
            forumCountry: [],
            countryList: [],
            fileUpload: false,
            trollboxCategoryList: [],
            categorySelectList: [],
            isShowSelectForumCountry:true,
            typeFilterOptions: {
                select: function(e) {
                    $scope.data.filter.type=typeFilter[e.index];
                    $scope.data.typeFilterOptions.index = e.index;
                    $scope.$apply();
                    $rootScope.$broadcast('videoIdentificationDestroy', true);
                },
                index: 0
            },
            isShowFilterType: true
        };

        $scope.data.setDefaultFilter = function() {
            $scope.data.filter.visibility='';
            $scope.data.filter.category='';
            $scope.data.filter.period='';
            $scope.data.filter.sort='dt';
        };

        $scope.data.onHide = function(kendoEvent) {
            $scope.data.typeFilterOptions.index = 0;
            $scope.data.isShowFilterType = false;
            $timeout(function() {
                $scope.data.isShowFilterType = true;
            });
            $rootScope.$broadcast('videoIdentificationDestroy', true);
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.trollbox.newMessage = {};

            if(kendoEvent.view.params.filter) {
                $scope.data.filter.visibility = kendoEvent.view.params.filter;
            }

            if(kendoEvent.view.params.type) {
                $scope.data.filter = {};
                $scope.data.filter.sort = 'dt';
                $scope.data.filter.type = kendoEvent.view.params.type;
                $scope.data.log.items=[];
                $scope.data.refresh();
                $scope.data.typeFilterOptions.index = 1;
                $scope.data.isShowFilterType = false;
                $timeout(function() {
                    $scope.data.isShowFilterType = true;
                });
                return;
            }

            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $timeout(function(){
                    kendo.mobile.application.showLoading();
                    jsonDataPromise('/ext-api-trollbox-new2/index')
                        .then(function (res) {
                            angular.extend($scope.data,res);

                            if(!res.filter) {
                                $scope.data.filter = {};
                                $scope.data.filter.sort = 'dt';
                            }

                            $scope.data.filter.type = '';

                            $scope.data.categorySelectList = getCategoryList(res.trollboxCategoryList);
                            $scope.data.isShowSelectForumCountry = false;
                            $timeout(function() {
                                $scope.data.isShowSelectForumCountry = true;
                            });
                            kendo.mobile.application.hideLoading();
                        },function(){
                            kendo.mobile.application.hideLoading();
                        });
                });
                $rootScope.refreshFlag=false;
            }
        };

        $scope.$watch('data.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                if(!isWatchFilter) {
                    isWatchFilter = true;
                    return;
                }

                if($scope.data.filter.visibility!=='MAIN') {
                    $scope.data.log.items=[];
                    $scope.data.refresh();
                } else {
                    kendo.mobile.application.navigate('view-user-profile.html?id='+status.user.id+'&scroll-to-trollbox-messages=1');
                }
            }
        },true);

        $scope.$watch('data.forumCountry',function(newValue,oldValue) {
            if (newValue != oldValue) {
                $scope.data.countryIds = [];
                if($scope.data.forumCountry.length > 0) {
                    $scope.data.countryIds = [];
                    angular.forEach($scope.data.forumCountry,function(item,index){
                        $scope.data.countryIds.push(item.id);
                    });
                    $scope.data.countryIds = $scope.data.countryIds.join(',');
                }

                $scope.data.refresh();
            }
        },true);


        $scope.data.refresh=function() {
            $scope.data.state.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.load();
        };

        $scope.data.loadMore=function() {
            if ($scope.data.state.loading) return;
            $scope.data.state.pageNum++;
            $scope.data.load();
        };

        $scope.data.load = function() {
            var data=$scope.data.log;

            if ($scope.data.state.loading) {
                $scope.data.state.modifiedWhileLoading=true;
                return;
            }

            $scope.data.state.loading=true;

            jsonDataPromise('/ext-api-trollbox-new2/list', {
                pageNum: $scope.data.state.pageNum,
                country_ids: $scope.data.countryIds,
                filter: $scope.data.filter
            })
                .then(function (res) {

                    $scope.data.state.loading=false;
                    $scope.data.trollboxCategoryList = res.trollboxCategoryList;

                    if ($scope.data.state.pageNum > 1) {
                        for(var msgIdx in $scope.data.log.items) {
                            for(var idx in res.log.items){
                                if($scope.data.log.items[msgIdx].id==res.log.items[idx].id) {
                                    res.log.items.splice(idx, 1);
                                    break;
                                }
                            }
                        }

                        if(res.log.items.length>0) {
                            res.log.items = data.items.concat(res.log.items);
                        } else {
                            $scope.data.state.pageNum++;
                            $scope.data.load();
                            return;
                        }
                    }

                    angular.extend(data, res.log);

                    $scope.data.categorySelectList = getCategoryList(res.trollboxCategoryList);

                    if ($scope.data.state.modifiedWhileLoading) {
                        $scope.data.state.modifiedWhileLoading=false;
                        $scope.data.load();
                    }
                },function(){
                    $scope.data.state.loading=false;
                });
        };

        $scope.data.trollboxVoteUp=function(id) {
            $rootScope.showInterstitialAdMob(function(result) {
                if (result) {
                    trollboxVote(id,1);
                }
            });
        };

        $scope.data.trollboxVoteDown=function(id) {
            trollboxVote(id,-1);
        };

        $scope.data.trollboxAcceptMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/accept-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==message.id) {
                                $scope.data.log.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.trollboxRejectMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/reject-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==message.id) {
                                $scope.data.log.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };


        $scope.data.enterGroupChat=function(id) {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-trollbox-new/enter-group-chat', {id: id})
                    .then(function (res) {
                        kendo.mobile.application.hideLoading();
                        if(res.result===true) {
                            kendo.mobile.application.navigate('view-chat.html?id='+res.groupChatId);
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.trollboxShowImage=function(message) {
            kendo.mobile.application.navigate('view-photoswipe.html?url=' + encodeURIComponent(message.image_big));
        };


        $scope.data.updateTrollbox = function() {
            $scope.data.refresh();
        };

        $scope.data.trollboxUploadImage = function() {
            uploadService.run(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE)
                .then(
                    function(file) {
                        $scope.data.trollbox.newMessage.image = file.thumbs.trollboxSmall;
                        $scope.data.trollbox.newMessage.file_id = file.id;
                    },
                    function(error) {
                    }
                );
        };


        $scope.data.trollboxUpload = function() {
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

        $rootScope.$on('setTrollboxMessage',function(event,data){
            $scope.data.trollbox.newMessage={};
            $scope.data.refresh();
        });

        /*jshint -W082 */
        function trollboxVote(id,vote) {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-trollbox-new/vote-message', {id: id, vote: vote})
                .then(function (res) {
                    kendo.mobile.application.hideLoading();
                    if(res.message) {
                        for(var msgIdx in $scope.data.log.items) {
                            if ($scope.data.log.items[msgIdx].id==res.message.id) {
                                $scope.data.log.items[msgIdx]=res.message;
                            }
                        }
                        if (status.user.id == 68) {
                            $scope.data.count_video_identification--;
                        }
                    }
                    modal.alert({message:res.result});
                },function(){
                    kendo.mobile.application.hideLoading();
                });
        }
        /*jshint +W082 */

        $scope.data.showVideo = function(message) {
            //window.plugins.streamingMedia.playVideo(message.file.url);
            uploadService.showMedia(message.file, 'VIDEO', message.id);
        };


        $scope.data.viewVotesVideo = function(id, type) {
            $rootScope.infoPopup.showTrollboxVotes=false;
            jsonDataPromise('/ext-api-trollbox-new/votes',{id:id, type: type})
                .then(function(data){
                    $rootScope.messageVotes=data;
                    $rootScope.messageVotes.type = type;
                    $rootScope.infoPopup.showTrollboxVotes=true;
                    $timeout(function() {
                        $('#view-votes-trollbox-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('votesTrollboxPopupResize');
                        }, 50);
                    });
                });
        };

        $scope.data.viewVotes=function(id) {
            $rootScope.infoPopup.showTrollboxVotes=false;
            jsonDataPromise('/ext-api-trollbox-new/votes',{id:id})
                .then(function(data){
                    $rootScope.messageVotes=data;
                    $rootScope.infoPopup.showTrollboxVotes=true;
                    $timeout(function() {
                        $('#view-votes-trollbox-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('votesTrollboxPopupResize');
                        }, 50);
                    });
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
                        $scope.data.trollbox.newMessage.image = data.thumbs.trollboxSmall;
                        $scope.data.trollbox.newMessage.file_id = data.id;
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
                            $scope.data.trollbox.newMessage.image = data.thumbs.trollboxSmall;
                            $scope.data.trollbox.newMessage.file_id = data.id;
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

                if($scope.data.trollbox.newMessage.text===undefined) {
                    $scope.data.trollbox.newMessage.text = urlPosition+' ';
                } else {
                    $scope.data.trollbox.newMessage.text = $scope.data.trollbox.newMessage.text + ' ' + urlPosition + ' ';
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


        $scope.data.trollboxBlockUser=function(message) {
            modal.confirmYesCancel({message:gettextCatalog.getString('Willst Du wirklich den Benutzer für alle Foren sperren?')}).then(function(result){
                if (result!==1) return;

                jsonPostDataPromise('/ext-api-moderator/block-user-in-trollbox-with-message',{groupChatId:message.id,userId:message.user.id}).then(function(data){
                    if (data.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].user.id==message.user.id) {
                                $scope.data.log.items[idx].user.is_blocked_in_trollbox=1;
                            }
                            if ($scope.data.log.items[idx].id==message.id) {
                                $scope.data.log.items[idx]=data.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:data.result});
                    }
                });
            });
        };

        $scope.data.trollboxUnblockUser=function(message) {
            modal.confirmYesCancel({message:gettextCatalog.getString('Willst Du wirklich den Benutzer für alle Foren entsperren?')}).then(function(result){
                if (result!==1) return;

                jsonPostDataPromise('/ext-api-moderator/unblock-user-in-trollbox',{groupChatId:message.id,userId:message.user.id}).then(function(data){
                    if (data.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].user.id==message.user.id) {
                                $scope.data.log.items[idx].user.is_blocked_in_trollbox=0;
                            }
                        }
                    } else {
                        modal.alert({message:data.result});
                    }
                });
            });
        };

        $scope.data.trollboxSetStickyTrollboxMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/set-sticky-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==message.id) {
                                $scope.data.log.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.trollboxUnsetStickyTrollboxMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/unset-sticky-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==message.id) {
                                $scope.data.log.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.resetFilter = function() {
            $scope.data.setDefaultFilter();
            $scope.data.forumCountry = [];
        };

    }

    /*jshint -W082 */
    function getCategoryList(categories) {
        var categoryList = [];
        for (var idx in categories) {
            categoryList.push({
                id: categories[idx].id,
                title: categories[idx].title + ' ('+categories[idx].count_message+')'
            });

        }
        return categoryList;
    }
    /*jshint +W082 */


});
