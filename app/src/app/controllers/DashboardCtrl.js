app.controller('DashboardCtrl', function ($scope,jsonDataPromise,$filter,$timeout,invite,jsonPostDataPromise,$rootScope,$interval,$localStorage,status,auth,settingsService,gettextCatalog,modal,uploadService,$cordovaCamera,$cordovaActionSheet,$cordovaDialogs,$log,$cordovaSpinnerDialog,$cordovaGeolocation) {

    var loadingNewTrollboxMessages=false;
    var loadNewTrollboxMessageAgainMsg=false;

    function trollboxGetNewMessages(msg) {
        if (loadingNewTrollboxMessages) {
            loadNewTrollboxMessageAgainMsg=msg;
            return;
        }

        var lastKnownId=$scope.data.trollbox.messages.length>0 ? $scope.data.trollbox.messages[0].id:null;

        if (lastKnownId==msg.id) return;

        loadingNewTrollboxMessages=true;

        jsonDataPromise('/ext-api-trollbox/get-new-messages', {lastKnownId: lastKnownId})
            .then(function (res) {
                for(var messageIdx=res.messages.length-1;messageIdx>=0;messageIdx--) {
                    var message=res.messages[messageIdx];
                    if ($scope.data.trollbox.messages.length===0 || $scope.data.trollbox.messages[0].id<message.id) {
                        $scope.data.trollbox.messages.unshift(message);
                    }
                }
                loadingNewTrollboxMessages=false;
                if (loadNewTrollboxMessageAgainMsg) {
                    trollboxGetNewMessages(loadNewTrollboxMessageAgainMsg);
                    loadNewTrollboxMessageAgainMsg=null;
                }
            },function() {
                loadingNewTrollboxMessages=false;
                if (loadNewTrollboxMessageAgainMsg) {
                    trollboxGetNewMessages(loadNewTrollboxMessageAgainMsg);
                    loadNewTrollboxMessageAgainMsg=null;
                }
            });
    }

    var loadingTrollboxHistory=false;

    function trollboxGetHistory() {
        if (loadingTrollboxHistory) {
            return;
        }

        var lastKnownId=$scope.data.trollbox.messages.length>0 ? $scope.data.trollbox.messages[$scope.data.trollbox.messages.length-1].id:null;

        loadingTrollboxHistory=true;

        jsonDataPromise('/ext-api-trollbox/get-history', {lastKnownId: lastKnownId})
            .then(function (res) {
                $scope.data.trollbox.messages=$scope.data.trollbox.messages.concat(res.messages);
                loadingTrollboxHistory=false;
            },function() {
                loadingTrollboxHistory=false;
            });
    }



    function trollboxVote(id,vote) {
        kendo.mobile.application.showLoading();
        jsonPostDataPromise('/ext-api-trollbox/vote-message', {id: id, vote: vote})
            .then(function (res) {
                kendo.mobile.application.hideLoading();
                if(res.message) {
                    for(var msgIdx in $scope.data.trollbox.messages) {
                        if ($scope.data.trollbox.messages[msgIdx].id==res.message.id) {
                            $scope.data.trollbox.messages[msgIdx]=res.message;
                        }
                    }
                    $scope.data.trollbox.newMessage={};
                }
                modal.alert({message:res.result});
            },function(){
                kendo.mobile.application.hideLoading();
            });
    }

    if (!$scope.data) {

        $scope.data = {
            isDashboardShow: false,
            trollbox: {
                newMessage: {},
				country:{},
                loading: false
            },
			user_status:{
				delay_invited_member:null
			},
			offers:[],
            fileUpload: false,
            loadingPageOffer: false,
            loadingPageSearchRequest: false,
            loadingPageVideo: false
        };
		var timer;
		var set_country_to_user=false;
		var siteHasLoaded=false;

		$scope.data.countryArrayInviteMe=[];
		$scope.data.countryArrayOffers=[];
		$scope.data.countryArraySearchRequests=[];
		$scope.data.countryArrayTrollbox=[];
		$scope.data.trollboxCategoryList=[];

        $scope.data.enterGroupChat=function(id) {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-trollbox/enter-group-chat', {id: id})
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

        $scope.data.trollboxSendMessage=function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-trollbox-new/send-message', {trollboxMessage: $scope.data.trollbox.newMessage,country:$scope.data.trollboxCountry})
                    .then(function (res) {
                        kendo.mobile.application.hideLoading();
                        if(res.trollboxMessage.$allErrors.length===0) {
                            $scope.data.trollbox.newMessage={};
                            $scope.data.trollbox.messages=res.trollboxMessages;
							angular.extend($scope.data.countryArrayTrollbox,res.countryArrayTrollbox);
                            if (res.message) {
                                modal.alert({message:res.message});
                            }
                        } else {
                            modal.showErrors(res.trollboxMessage.$allErrors);
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $rootScope.$on('setTrollboxMessage',function(event,data){
            $scope.data.trollbox.newMessage={};
            $scope.data.updateTrollbox();
            //$scope.data.trollbox.messages=data;
        });

        $scope.data.trollboxAcceptMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/accept-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.trollbox.messages) {
                            if ($scope.data.trollbox.messages[idx].id==message.id) {
                                $scope.data.trollbox.messages[idx]=res.trollboxMessage;
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
                        for(var idx in $scope.data.trollbox.messages) {
                            if ($scope.data.trollbox.messages[idx].id==message.id) {
                                $scope.data.trollbox.messages[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $rootScope.$on('messengerService.trollboxNewMessage',function(event,msg) {
            if ($scope.data.trollboxScrollPos>5) return;
            trollboxGetNewMessages(msg);
        });

        $scope.data.trollboxScroll=function(event) {
            /*
            $scope.data.trollboxScrollPos=event.scrollTop;
            $scope.data.trollboxScrollHeight=event.sender.scrollHeight();
            */
        };

        $scope.data.trollboxShowImage=function(message) {
            kendo.mobile.application.navigate('view-photoswipe.html?url=' + encodeURIComponent(message.image_big));
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

        $scope.data.invite=function(data) {
            invite.invite(data);
        };

        $rootScope.$on('BecomeMemberInviteWinner',function(event,winner) {
            for(var idx in $scope.data.inviteMe) {
                var invite=$scope.data.inviteMe[idx];
                if (invite.id==winner.user_id) {
                    invite.winner=winner;
                }
                //$scope.data.inviteMe[idx]=angular.copy(invite);
            }
        });

        $scope.data.onShow=function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                if (!$rootScope.showStartPopup()) {
                    $rootScope.showFriendsPopup();
				}

				$scope.data.refresh(kendoEvent);

                $scope.settings = angular.copy(settingsService.settings);
                $scope.data.settingAll = isSettingAll(settingsService.settings);

                $scope.data.unwatch = $scope.$watch('data.settingAll', function(data, old_data) {
                    if (data !== old_data) {
                        var result = settingsAllOnOff($scope.settings, $scope.data.settingAll);
                        settingsService.save(result);
                    }
                }, true);

                $scope.data.loadPageOffers=true;
                $scope.data.pageNumOffers=1;
                $scope.data.loadPageSearchRequest=true;
                $scope.data.pageNumSearchRequest=1;
				$scope.data.loadPageVideos=true;
                $scope.data.pageNumVideos=1;

                if((auth.isLogined() && status.user.later_profile_fillup_date===1) && (!status.user.birthday || status.user.birthday==='' || status.user.birthday=='0000-00-00' || !status.user.city || status.user.city==='') && (status.user.packet=='VIP' || status.user.packet=='STANDART')) {
                    kendo.mobile.application.navigate('view-profile-fillup.html');
                }
                $rootScope.refreshFlag=false;
            }

            status.update();
        };



        $scope.data.onHide=function(event) {
            $scope.data.unwatch();
            $rootScope.$broadcast('videoIdentificationDestroy', true);
        };

        $scope.data.updateTrollbox = function() {
            var data=$scope.data.trollbox;
			if(!data.loading){
				var countries_trollbox = $scope.data.trollboxCountry.map(function(a){return a.id;});
				data.loading=true;
				jsonDataPromise('/ext-api-dashboard-ad-new/get-trollbox',{country_ids:angular.toJson(countries_trollbox)})
					.then(function (res) {
						angular.extend(data.messages, res.items);
						$scope.data.countryArrayTrollbox=res.countryArrayTrollbox;
						$scope.data.trollboxCategoryList=res.trollboxCategoryList;
						data.loading=false;
					},function(){
						data.loading=false;
					});
			}
        };

        $scope.data.newsShowImage=function(images) {
            kendo.mobile.application.navigate('view-photoswipe.html?url=' + encodeURIComponent(images.fancybox));
        };

    }

    $scope.data.refresh = function(kendoEvent) {
        $scope.data.isDashboardShow = false;

        $timeout(function(){
            kendo.mobile.application.showLoading();

            jsonDataPromise('/ext-api-dashboard-new/index').then(function (res) {
                angular.extend($scope.data,res.results);

                if(status.user.country_id) {
                    $scope.data.trollboxCountry = [{id:status.user.country_id}];
                    $scope.data.searchRequestsCountry = [{id:status.user.country_id}];
                    $scope.data.offersCountry = [{id:status.user.country_id}];
                    $scope.data.inviteMeCountry = [{id:status.user.country_id}];
                }

                $scope.labels=$rootScope.status.labels;
                $scope.data.trollbox.messages=res.results.trollboxMessages;
                $scope.data.trollboxScrollPos = 0;

                $scope.data.user_status.delay_invited_member=$rootScope.status.user.delay_invited_member;
                $timeout.cancel(timer);
                $scope.data.callDelayInvitedMemberTimeout();
                $scope.data.isDashboardShow = true;
                kendo.mobile.application.hideLoading();
            },function(){
                $scope.data.isDashboardShow = true;
                kendo.mobile.application.hideLoading();
            });

            if (kendoEvent) {
                kendoEvent.view.scroller.scrollTo(0, 0);
            }
        });

    };

    $interval(function(){
        if(auth.isLogined() && ((new Date()).getTime() > $localStorage.showProfileFillup) && (!status.user.birthday || status.user.birthday==='') && (!status.user.city || status.user.city==='') && (status.user.packet=='VIP_PLUS' || status.user.packet=='VIP' || status.user.packet=='STANDART')) {
            kendo.mobile.application.navigate('#view-profile-fillup.html');
        }
    }, 15000);

    function settingsAllOnOff(data, settingAll) {
        for(var item in data.notifications) {
            data.notifications[item] = settingAll;
        }
        for(var item2 in data.sound) {
            data.sound[item2] = settingAll;
        }
        return data;
    }

    function isSettingAll(data) {
        for(var item in data.notifications) {
            if(data.notifications[item])
                return true;
        }
        for(var item2 in data.sound) {
            if(data.sound[item2])
                return true;
        }
        return false;
    }


    $scope.data.goItemNews = function(id) {
        var newsId = id;
        $rootScope.refreshFlag = true;
        kendo.mobile.application.navigate('#view-news.html?id='+newsId);
    };

    $scope.data.goItemFaq = function(id) {
        var faqId = id;
        $rootScope.refreshFlag = true;
        kendo.mobile.application.navigate('#view-faqs.html?id='+faqId);
    };

	function addOffers(swiper){
	    if ($scope.data.loadingPageOffers) {
	        return;
        }

		if($scope.data.loadPageOffers) {
            kendo.mobile.application.showLoading();
            $scope.data.pageNumOffers++;
            var countries_offer=$scope.data.offersCountry.map(function(a){return a.id;});

            $scope.data.loadingPageOffers=true;
            jsonDataPromise('/ext-api-dashboard-ad-new/get-offers',{
                pageNum:$scope.data.pageNumOffers,
                country_ids:angular.toJson(countries_offer)
            }).then(function(res){
                if(res.offers.length>0) {
                    for(i=0; i <res.offers.length;i++){
                        $scope.data.offers.push(res.offers[i]);
                    }

                    $timeout(function(){
                        swiper.update();
                        swiper.unlockSwipeToNext();
                        $scope.data.loadingPageOffers=false;
                    });

                    $scope.data.loadPageOffers = true;
                } else {
                    $scope.data.loadPageOffers = false;
                }
                swiper.unlockSwipeToNext();
                kendo.mobile.application.hideLoading();
            },function(res) {
                $scope.data.loadingPageOffers=false;
            });
		}
	}

	function addSearchRequests(swiper){
        if ($scope.data.loadingPageSearchRequest) {
            return;
        }

		if($scope.data.loadPageSearchRequest) {
            kendo.mobile.application.showLoading();
            $scope.data.pageNumSearchRequest++;
            var countries_sr=$scope.data.searchRequestsCountry.map(function(a){return a.id;});

            $scope.data.loadingPageSearchRequest = true;
            jsonDataPromise('/ext-api-dashboard-ad-new/get-search-request',{
                pageNum:$scope.data.pageNumSearchRequest,
                country_ids:angular.toJson(countries_sr)
            }).then(function(res){
                if(res.searchRequest.length > 0) {
                    for(i=0; i < res.searchRequest.length;i++){
                        $scope.data.searchRequest.push(res.searchRequest[i]);
                    }

                    $timeout(function(){
                        swiper.update();
                        swiper.unlockSwipeToNext();
                        $scope.data.loadingPageSearchRequest = false;
                    });

                    $scope.data.loadPageSearchRequest = true;
                } else {
                    $scope.data.loadPageSearchRequest = false;
                }
                swiper.unlockSwipeToNext();
                kendo.mobile.application.hideLoading();
            }, function (res) {
                $scope.data.loadingPageSearchRequest = false;
                kendo.mobile.application.hideLoading();
            });
        }
	}

	function addVideos(swiper){
        if ($scope.data.loadingPageVideo) {
            return;
        }

        $scope.data.pageNumVideos++;
        kendo.mobile.application.showLoading();
        $scope.data.loadingPageVideo = true;
        jsonDataPromise('/ext-api-dashboard-ad-new/get-videos',{pageNum:$scope.data.pageNumVideos}).then(function(res){
            if(res.videos.length>0) {
                for(i=0; i <res.videos.length;i++){
                    $scope.data.videos.push(res.videos[i]);
                }

                $timeout(function(){
                    swiper.update();
                    swiper.unlockSwipeToNext();
                    $scope.data.loadingPageVideo = false;
                });

                $scope.data.loadPageVideos = true;
            } else {
                $scope.data.loadPageVideos = false;
                swiper.unlockSwipeToNext();
            }

            kendo.mobile.application.hideLoading();
        },function(){
            $scope.data.loadPageVideos = false;
            $scope.data.loadingPageVideo = false;
            swiper.unlockSwipeToNext();
        });

	}

	function updateInviteMe(){
        kendo.mobile.application.showLoading();
        var countries_invite=$scope.data.inviteMeCountry.map(function(a){return a.id;});
        jsonDataPromise('/ext-api-dashboard-ad-new/get-invite-me',{
            country_ids:angular.toJson(countries_invite)
        }).then(function(res){
            $scope.data.inviteMe=res.inviteMe;
            $scope.data.user_status.delay_invited_member=$rootScope.status.user.delay_invited_member;
            $timeout.cancel(timer);
            $scope.data.callDelayInvitedMemberTimeout();
            kendo.mobile.application.hideLoading();
        }, function (res) {
            kendo.mobile.application.hideLoading();
        });
	}


	function updateOffers(){
        $scope.data.pageNumOffers=1;
        var countries_offer=$scope.data.offersCountry.map(function(a){return a.id;});
        kendo.mobile.application.showLoading();
        jsonDataPromise('/ext-api-dashboard-ad-new/get-offers',{pageNum:$scope.data.pageNumOffers,country_ids:angular.toJson(countries_offer)}).then(function(res){
            if(res.offers.length > 0){
                $scope.data.offers=res.offers;
                $scope.data.loadPageOffers = true;
            } else{
                $scope.data.loadPageOffers = false;
            }
            kendo.mobile.application.hideLoading();
        },function(){
            $scope.data.loadPageOffers = false;
            kendo.mobile.application.hideLoading();
        });
	}

	function updateSearchRequests(){
        $scope.data.pageNumSearchRequest=1;
        var countries_sr=$scope.data.searchRequestsCountry.map(function(a){return a.id;});
        kendo.mobile.application.showLoading();
        jsonDataPromise('/ext-api-dashboard-ad-new/get-search-request',{pageNum:$scope.data.pageNumSearchRequest,country_ids:angular.toJson(countries_sr)}).then(function(res){
            if(res.searchRequest.length > 0){
                $scope.data.searchRequest=res.searchRequest;
                $scope.data.loadPageSearchRequest = true;
            }
            else{
                $scope.data.loadPageSearchRequest = false;
            }
            kendo.mobile.application.hideLoading();
        },function(){
            kendo.mobile.application.hideLoading();
        });
	}

	function updateTrollboxOnChange(){
        if(!$scope.data.trollbox.loading){
            $scope.data.trollbox.loading=true;
            var countries_trollbox=$scope.data.trollboxCountry.map(function(a){return a.id;});
            $scope.data.trollbox.country_ids=angular.toJson(countries_trollbox);
            kendo.mobile.application.showLoading();

            $scope.data.trollboxCountryIds = [];
            if($scope.data.trollboxCountry.length > 0) {
                angular.forEach($scope.data.trollboxCountry,function(item,index){
                    $scope.data.trollboxCountryIds.push(item.id);
                });
            }
            $scope.data.trollboxCountryIds = $scope.data.trollboxCountryIds.join(',');

            kendo.mobile.application.showLoading();
            jsonDataPromise('/ext-api-dashboard-ad-new/get-trollbox',{country_ids:angular.toJson(countries_trollbox)}).then(function(res){
                $scope.data.trollbox.messages=res.items;
                $scope.data.dashboardForumText=res.dashboardForumText;
                $scope.data.trollboxCategoryList=res.trollboxCategoryList;
                $scope.data.trollbox.loading=false;
                kendo.mobile.application.hideLoading();
            }, function (res) {
                kendo.mobile.application.hideLoading();
            });
        }
	}

	$scope.data.onChangeSearchRequests=function() {
        updateSearchRequests();
	};

	$scope.data.onChangeOffers=function() {
        updateOffers();
	};

	$scope.data.onChangeInviteMe=function() {
	    updateInviteMe();
	};

	$scope.data.onChangeTrollbox=function() {
        updateTrollboxOnChange();
	};

	/*InviteMe*/
	$scope.onReadySwiperInviteMe = function (swiper) {
        $scope.$watch('data.inviteMe', function(data, old_data) {
            $timeout(function(){
                swiper.update();
                swiper.slideTo(0);
            });
        });
        $scope.$watch('data.user_status.delay_invited_member', function(data, old_data) {
            if(data===0){
                $timeout(function(){
                    swiper.update();
                    swiper.slideTo(0);
                });
            }
        });
	};
	/*InviteMe*/

	/*Offers*/
	$scope.onReadySwiperOffers = function (swiper) {
        $scope.$watch('data.offers', function(data, old_data) {
            $timeout(function(){
                swiper.update();
                swiper.slideTo(0);
            });
        });
        if($scope.data.loadPageOffers){
            swiper.on('sliderMove',function(){
                if(swiper.isEnd){
                    swiper.lockSwipeToNext();
                    addOffers(swiper);
                    swiper.unlockSwipeToNext();
                }
            });
        } else {
            swiper.off('sliderMove');
            swiper.unlockSwipeToNext();
        }
	};
	/*Offers*/

	/*Search Requests*/
	$scope.onReadySwiperSearchRequests = function (swiper) {
        $scope.$watch('data.searchRequest', function(data, old_data) {
            $timeout(function(){
                swiper.update();
                swiper.slideTo(0);
            });
        });
        if($scope.data.loadPageSearchRequest){
            swiper.on('sliderMove',function(){
                if(swiper.isEnd){
                    swiper.lockSwipeToNext();
                    addSearchRequests(swiper);
                    swiper.unlockSwipeToNext();
                }
            });
        }
        else{
            swiper.off('sliderMove');
            swiper.unlockSwipeToNext();
        }
	};
	/*Search Requests*/

	/*Videos*/
	$scope.onReadySwiperVideos = function (swiper) {
        $scope.$watch('data.videos', function(data, old_data) {
            $timeout(function(){
                swiper.update();
                swiper.slideTo(0);
            });
        });
        if($scope.data.loadPageVideos){
            swiper.on('sliderMove',function(){
                if(swiper.isEnd){
                    swiper.lockSwipeToNext();
                    addVideos(swiper);
                    swiper.unlockSwipeToNext();
                }
            });
        }else{
            swiper.off('sliderMove');
            swiper.unlockSwipeToNext();
        }
	};
	/*Videos*/

	$scope.data.callDelayInvitedMemberTimeout = function() {
        timer=$timeout( function(){
            $scope.data.user_status.delay_invited_member = 0;
        },$rootScope.status.user.delay_invited_member*1000);
	};

	this.setAdvertising = function (id, user_bonus, click_interval,ad_link, popup_interval) {
		var advertisements = {};
		advertisements.id = id;
		advertisements.user_bonus = user_bonus;
		advertisements.click_interval = click_interval;
		advertisements.popup_interval = parseInt(popup_interval);
		jsonDataPromise('/ext-api-advertising/set-advertising-user', { advertising_id: id, advertising_click_interval: click_interval })
			.then(function (data) {
				if (user_bonus > 0 && data.result === true) {
						$timeout(function(){
							$('#advertising-view-bonus-popup').kendoMobileModalView('open');
							$timeout(function() {
								var ref = cordova.InAppBrowser.open(ad_link, '_blank', 'location=yes');
								$rootScope.$broadcast('advertisingViewBonusPopup',advertisements, ref);
							});
						},1000);
				}else{
					cordova.InAppBrowser.open(ad_link, '_blank', 'location=yes');
				}
		});
	};

    $scope.data.showVideo = function(message) {
        uploadService.showMedia(message.file, 'VIDEO', message.id);
    };


    $scope.data.viewVotes=function(id) {
        $rootScope.infoPopup.showTrollboxVotes=false;
        jsonDataPromise('/ext-api-trollbox/votes',{id:id})
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
                    for(var idx in $scope.data.trollbox.messages) {
                        if ($scope.data.trollbox.messages[idx].user.id==message.user.id) {
                            $scope.data.trollbox.messages[idx].user.is_blocked_in_trollbox=1;
                        }
                        if ($scope.data.trollbox.messages[idx].id==message.id) {
                            $scope.data.trollbox.messages[idx]=data.trollboxMessage;
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
                    for(var idx in $scope.data.trollbox.messages) {
                        if ($scope.data.trollbox.messages[idx].user.id==message.user.id) {
                            $scope.data.trollbox.messages[idx].user.is_blocked_in_trollbox=0;
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
                    for(var idx in $scope.data.trollbox.messages) {
                        if ($scope.data.trollbox.messages[idx].id==message.id) {
                            $scope.data.trollbox.messages[idx]=res.trollboxMessage;
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
                    for(var idx in $scope.data.trollbox.messages) {
                        if ($scope.data.trollbox.messages[idx].id==message.id) {
                            $scope.data.trollbox.messages[idx]=res.trollboxMessage;
                        }
                    }
                } else {
                    modal.alert({message:res.result});
                }
            });
    };

});