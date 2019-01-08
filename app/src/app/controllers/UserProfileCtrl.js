app.controller('UserProfileCtrl', function ($scope,$timeout,jsonDataPromise,jsonPostDataPromise,modal,$cordovaSpinnerDialog,gettextCatalog,$log,$rootScope,status,uploadService) {

    if (!$scope.data) {

        $scope.$on('spamReported',function() {
            $scope.data.userInfo.spamReported=true;
        });

        $scope.data={
            feedbackUser: 0,
            feedbackDeals: 0,
            teamFeedback: {},
            friends: {
                sort: ''
            },
            followers: {},
            trollboxMessages: {},
            isShowProfile: false
        };

        $scope.data.onHide = function(kendoEvent) {
            $scope.data.userInfo={avatarUrl:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};
            $rootScope.$broadcast('videoIdentificationDestroy', true);
        };

        $scope.data.onShow = function(kendoEvent) {

            $scope.data.isShowProfile = false;
            $scope.data.feedbackUser = 0;
            $scope.data.feedbackDeals = 0;
            kendo.mobile.application.view().scroller.scrollTo(0, 0);

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-profile/index',{id:kendoEvent.view.params.id})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();

                        $scope.data.followersShow = 0;
                        $scope.data.friendsShow = 0;
                        $scope.data.trollboxMessagesShow = 0;

                        $scope.data.feedback.loading = false;
                        $scope.data.feedback.updatedWhileLoading= false;
                        $scope.data.feedback.pageNum = 1;

                        $scope.data.teamFeedback.loading = false;
                        $scope.data.teamFeedback.updatedWhileLoading= false;
                        $scope.data.teamFeedback.pageNum = 1;

                        $scope.data.friends.loading = false;
                        $scope.data.friends.updatedWhileLoading= false;
                        $scope.data.friends.pageNum = 1;

                        $scope.data.followers.loading = false;
                        $scope.data.followers.updatedWhileLoading= false;
                        $scope.data.followers.pageNum = 1;

                        $scope.data.trollboxMessages.loading = false;
                        $scope.data.trollboxMessages.updatedWhileLoading= false;
                        $scope.data.trollboxMessages.pageNum = 1;

                        if (kendoEvent.view.params['scroll-to-teamleader']) {
                            $timeout(function(){
                                var scroller=$('.km-content:visible').data('kendoMobileScroller');
                                var scrollTo=scroller.scrollHeight()-scroller.height();
                                scroller.scrollTo(0,-scrollTo);
                            });
                        }

                        if (kendoEvent.view.params['scroll-to-teamleader-feedbacks']) {
                            $scope.data.feedbackUser=true;
                            $timeout(function(){
                                var scroller=$('.km-content:visible').data('kendoMobileScroller');
                                var scrollTo = $('#team-feedbacks').position().top + $('.km-content:visible').data('kendoMobileScroller').scrollTop;
                                scroller.scrollTo(0,-scrollTo);
                            });
                        }

                        if (kendoEvent.view.params['scroll-to-trollbox-messages']) {
                            $scope.data.trollboxMessagesShow = true;
                            $timeout(function() {
                                var scroller=$('.km-content:visible').data('kendoMobileScroller');
                                var scrollTo = $('#main-trollbox-messages').position().top;
                                scroller.scrollTo(0,-scrollTo);
                            });
                        }

                        $scope.data.getProfileImages();
                        $scope.data.isShowProfile = true;

                    },function(){
                        $scope.data.isShowProfile = true;
                        kendo.mobile.application.hideLoading();
                    });
            },0);
        };

        $rootScope.$on('userTeamRequestAdded2',function(event,user_id) {
            if ($scope.data.userInfo.id==user_id) {
                $scope.data.userInfo.request_sent2=true;
            }
        });

        $rootScope.$on('userTeamRequestAdded',function(event,user_id) {
            if ($scope.data.userInfo.id==user_id) {
                $scope.data.userInfo.request_sent=true;
            }
        });

        $rootScope.$on('stickUserRequestSent',function(event,user_id) {
            if ($scope.data.userInfo.id==user_id) {
                $scope.data.userInfo.canCreateStickRequest=false;
            }
        });

        $rootScope.$on('UserTeamFeedbackResponse',function(event,data) {
            for(var idx in $scope.data.teamFeedback.items) {
                var feedback=$scope.data.teamFeedback.items[idx];
                if (feedback.id==data.id) {
                    angular.extend(feedback,data);
                }
            }
        });

        $rootScope.$on('UserFeedbackResponse',function(event,data) {
            for(var idx in $scope.data.feedback.items) {
                var feedback=$scope.data.feedback.items[idx];
                if (feedback.id==data.id) {
                    angular.extend(feedback,data);
                }
            }
        });

        $scope.data.loadMore=function() {
            if ($scope.data.feedback.loading) return;
            $scope.data.feedback.pageNum++;
            $scope.data.load();
        };

        $scope.data.load = function() {

            if ($scope.data.feedback.loading) {
                $scope.data.feedback.modifiedWhileLoading=true;
                return;
            }

            $scope.data.feedback.loading=true;

            jsonDataPromise('/ext-api-user-profile/feedback', {
                userId: $scope.data.userInfo.id,
                pageNum: $scope.data.feedback.pageNum
            })
                .then(function (res) {
                    $scope.data.feedback.loading=false;

                    if ($scope.data.feedback.pageNum > 1) {
                        res.feedback.items = $scope.data.feedback.items.concat(res.feedback.items);
                    }

                    angular.extend($scope.data.feedback, res.feedback);

                    if ($scope.data.feedback.modifiedWhileLoading) {
                        $scope.data.feedback.modifiedWhileLoading=false;
                        $scope.data.load();
                    }
                },function(){
                    $scope.data.feedback.loading=false;
                });
        };

        $scope.data.teamFeedbackLoadMore=function() {
            if ($scope.data.teamFeedback.loading) return;
            $scope.data.teamFeedback.pageNum++;
            $scope.data.teamFeedbackLoad();
        };

        $scope.data.teamFeedbackLoad = function() {

            if ($scope.data.teamFeedback.loading) {
                $scope.data.teamFeedback.modifiedWhileLoading=true;
                return;
            }

            $scope.data.teamFeedback.loading=true;

            jsonDataPromise('/ext-api-user-profile/team-feedback', {
                userId: $scope.data.userInfo.id,
                pageNum: $scope.data.teamFeedback.pageNum
            })
                .then(function (res) {
                    $scope.data.teamFeedback.loading=false;

                    if ($scope.data.teamFeedback.pageNum > 1) {
                        res.teamFeedback.items = $scope.data.teamFeedback.items.concat(res.feedback.items);
                    }

                    angular.extend($scope.data.teamFeedback, res.feedback);

                    if ($scope.data.teamFeedback.modifiedWhileLoading) {
                        $scope.data.teamFeedback.modifiedWhileLoading=false;
                        $scope.data.teamFeedbackLoad();
                    }
                },function(){
                    $scope.data.teamFeedback.loading=false;
                });
        };

        $scope.data.friendsLoadMore=function() {
            if ($scope.data.friends.loading) return;
            $scope.data.friends.pageNum++;
            $scope.data.friendsLoad();
        };

        $scope.data.friendsLoad = function() {

            if ($scope.data.friends.loading) {
                $scope.data.friends.modifiedWhileLoading=true;
                return;
            }

            $scope.data.friends.loading=true;

            jsonDataPromise('/ext-api-user-profile/friends', {
                userId: $scope.data.userInfo.id,
                pageNum: $scope.data.friends.pageNum,
                sort: $scope.data.friends.sort
            })
                .then(function (res) {
                    $scope.data.friends.loading=false;

                    if ($scope.data.friends.pageNum > 1) {
                        res.friends.users = $scope.data.friends.users.concat(res.friends.users);
                    }

                    angular.extend($scope.data.friends, res.friends);

                    if ($scope.data.friends.modifiedWhileLoading) {
                        $scope.data.friends.modifiedWhileLoading=false;
                        $scope.data.friendsLoad();
                    }
                },function(){
                    $scope.data.friends.loading=false;
                });
        };



        $scope.data.goToChat=function() {
            kendo.mobile.application.navigate('view-chat.html?id=' + $scope.data.userInfo.id);
        };

        $scope.data.deleteFriend=function() {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('You really want to delete this user from friends?'),
                title: gettextCatalog.getString('Kontakt entfernen')
            }).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    $cordovaSpinnerDialog.show(gettextCatalog.getString('Processing request'),gettextCatalog.getString('Contacting server'),true);

                    jsonPostDataPromise('/ext-api-user-profile/delete-friend',{friendId:$scope.data.userInfo.id})
                        .then(function (res) {
                            angular.extend($scope.data,res);
                            $cordovaSpinnerDialog.hide();
                        },function(){
                            $cordovaSpinnerDialog.hide();
                        });
                }
            });
        };

        $scope.data.addToIgnoreList=function() {
                    $cordovaSpinnerDialog.show(gettextCatalog.getString('Processing request'),gettextCatalog.getString('Contacting server'),true);

                    jsonPostDataPromise('/ext-api-user-profile/add-to-ignore-list',{friendId:$scope.data.userInfo.id})
                        .then(function (res) {
                            angular.extend($scope.data,res);
                            $cordovaSpinnerDialog.hide();
                        },function(){
                            $cordovaSpinnerDialog.hide();
                        });
        };

        $scope.data.delFromIgnoreList=function() {
            $cordovaSpinnerDialog.show(gettextCatalog.getString('Processing request'),gettextCatalog.getString('Contacting server'),true);

            jsonPostDataPromise('/ext-api-user-profile/del-from-ignore-list',{friendId:$scope.data.userInfo.id})
                .then(function (res) {
                    angular.extend($scope.data,res);
                    $cordovaSpinnerDialog.hide();
                },function(){
                    $cordovaSpinnerDialog.hide();
                });
        };

        $scope.data.addFriend=function() {
            $cordovaSpinnerDialog.show(gettextCatalog.getString('Processing request'),gettextCatalog.getString('Contacting server'),true);

            jsonPostDataPromise('/ext-api-user-profile/add-friend',{friendId:$scope.data.userInfo.id})
                .then(function (res) {
                    angular.extend($scope.data,res);
                    $cordovaSpinnerDialog.hide();
                    modal.alert({message:res.result});
                },function(){
                    $cordovaSpinnerDialog.hide();
                });
        };

        $scope.data.profileShowImage = function() {
            var photos = [];
            photos.push($scope.data.userInfo.avatar.image_big);
            for(var idx in $scope.data.userInfo.photos) {
                photos.push($scope.data.userInfo.photos[idx]);
            }
            $rootScope.userPhotos = photos;
            kendo.mobile.application.navigate('view-photoswipe.html?urls=true');
        };

        $scope.data.getProfileImages = function() {
            var photos = [];
            photos.push($scope.data.userInfo.avatar.image_big);
            for(var idx in $scope.data.userInfo.photos) {
                photos.push($scope.data.userInfo.photos[idx]);
            }
            $scope.data.userInfo.profileImages = photos;
        };


        $scope.data.blockTeamChange = function() {
            modal.alert({message: gettextCatalog.getString('Lieber Jugler, ein Teamwechsel ist nur alle 24h möglich.')});
        };

        $scope.data.teamChangeRequestPopup2 = function() {
            if(status.user.packet != 'VIP' && status.user.packet != 'VIP_PLUS') {
                modal.confirmYesCancel({
                    message: gettextCatalog.getString('Diese Funktion steht nur Premium MItgliedern zur Verfügung.'),
                    buttonArray: [
                        gettextCatalog.getString('Jetzt Premium-Mitglied werden'),
                        gettextCatalog.getString('Ok')
                    ]
                }).then(function(result) {
                    if (result==1) {
                        kendo.mobile.application.replace('#view-registration-payment.html?isUpgrade=1');
                    }
                });
            }
        };

        $scope.data.subscribe=function() {
            jsonPostDataPromise('/ext-api-user-profile/change-subscribe',{subscribeUserId: $scope.data.userInfo.id})
                .then(function (data) {
                    if (data.result===true) {
                        $scope.data.userInfo.isMyFollow = true;
                    }
                });
        };

        $scope.data.unsubscribe=function() {
            jsonPostDataPromise('/ext-api-user-profile/change-subscribe',{subscribeUserId: $scope.data.userInfo.id})
                .then(function (data) {
                    if (data.result===true) {
                        $scope.data.userInfo.isMyFollow = false;
                    }
                });
        };

        $scope.data.followersLoadMore=function() {
            if ($scope.data.followers.loading) return;
            $scope.data.followers.pageNum++;
            $scope.data.followersLoad();
        };

        $scope.data.followersLoad = function() {

            if ($scope.data.followers.loading) {
                $scope.data.followers.modifiedWhileLoading=true;
                return;
            }

            $scope.data.followers.loading=true;

            jsonDataPromise('/ext-api-user-profile/followers', {
                userId: $scope.data.userInfo.id,
                pageNum: $scope.data.followers.pageNum
            })
                .then(function (res) {
                    $scope.data.followers.loading=false;

                    if ($scope.data.followers.pageNum > 1) {
                        res.followers.users = $scope.data.followers.users.concat(res.followers.users);
                    }

                    angular.extend($scope.data.followers, res.followers);

                    if ($scope.data.followers.modifiedWhileLoading) {
                        $scope.data.followers.modifiedWhileLoading=false;
                        $scope.followers.followersLoad();
                    }
                },function(){
                    $scope.data.followers.loading=false;
                });
        };


        /*jshint -W082 */
        function changeSubscribe(id) {
            jsonPostDataPromise('/ext-api-user-profile/change-subscribe',{subscribeUserId: id})
                .then(function (data) {
                    if (data.result===true) {
                        for (var idx in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idx].id == id) {
                                $scope.data.friends.users[idx].isFollow = data.isFollow;
                            }
                        }
                    }
                });
        }
        /*jshint +W082 */

        /*jshint -W082 */
        function changeFriend(id) {
            jsonPostDataPromise('/ext-api-user-profile/change-friend',{friendUserId: id})
                .then(function (data) {
                    if (data.result===true) {
                        for (var idx in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idx].id == id) {
                                $scope.data.friends.users[idx].isFriend = data.isFriend;
                            }
                        }
                    }
                });
        }
        /*jshint +W082 */


        $scope.data.changeSubscribe = function(user) {
            if(user.isFriend===false) {
                var userName = user.first_name+' '+user.last_name;
                modal.confirmYesCancel({
                    message: gettextCatalog.getString('Möchtest Du '+userName+' wirklich aus Deinen Kontakten entfernen?')
                }).then(function(result) {
                    if (result==1) {
                        changeSubscribe(user.id);
                        for (var idx in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idx].id == user.id) {
                                $scope.data.friends.users.splice(idx, 1);
                            }
                        }
                        $scope.data.friends.count--;
                    } else {
                        for (var idy in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idy].id == user.id) {
                                $scope.data.friends.users[idy].isFollow = true;
                            }
                        }
                    }
                });
            } else {
                changeSubscribe(user.id);
            }
        };

        $scope.data.changeFriend = function(user) {
            if(user.isFollow===false) {
                var userName = user.first_name+' '+user.last_name;
                modal.confirmYesCancel({
                    message: gettextCatalog.getString('Möchtest Du '+userName+' wirklich aus Deinen Kontakten entfernen?')
                }).then(function(result) {
                    if (result==1) {
                        changeFriend(user.id);
                        for (var idx in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idx].id == user.id) {
                                $scope.data.friends.users.splice(idx, 1);
                            }
                        }
                        $scope.data.friends.count--;
                    } else {
                        for (var idy in $scope.data.friends.users) {
                            if ($scope.data.friends.users[idy].id == user.id) {
                                $scope.data.friends.users[idy].isFriend = true;
                            }
                        }
                    }
                });
            } else {
                changeFriend(user.id);
            }
        };

        $scope.data.gotoValidationPhone = function() {
            kendo.mobile.application.navigate('view-profile-update.html?scroll-to-validation-phone');
        };

        $scope.data.gotoValidationPassport = function() {
            $rootScope.openUrlInBrowser(config.urls.payout);
        };


        $scope.data.trollboxMessagesLoadMore=function() {
            if ($scope.data.trollboxMessages.loading) return;
            $scope.data.trollboxMessages.pageNum++;
            $scope.data.trollboxMessagesLoad();
        };

        $scope.data.trollboxMessagesLoad = function() {

            if ($scope.data.trollboxMessages.loading) {
                $scope.data.trollboxMessages.modifiedWhileLoading=true;
                return;
            }

            $scope.data.trollboxMessages.loading=true;

            jsonDataPromise('/ext-api-user-profile/trollbox-messages', {
                userId: $scope.data.userInfo.id,
                pageNum: $scope.data.trollboxMessages.pageNum
            })
                .then(function (res) {
                    $scope.data.trollboxMessages.loading=false;

                    if ($scope.data.trollboxMessages.pageNum > 1) {
                        res.trollboxMessages.items = $scope.data.trollboxMessages.items.concat(res.trollboxMessages.items);
                    }

                    angular.extend($scope.data.trollboxMessages, res.trollboxMessages);

                    if ($scope.data.trollboxMessages.modifiedWhileLoading) {
                        $scope.data.trollboxMessages.modifiedWhileLoading=false;
                        $scope.trollboxMessages.trollboxMessagesLoad();
                    }
                },function(){
                    $scope.data.trollboxMessages.loading=false;
                });
        };


        function trollboxVote(message,vote) {
            if(message.status=='DELETED') {
                return;
            }
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-trollbox-new/vote-message', {id: message.id, vote: vote})
                .then(function (res) {
                    kendo.mobile.application.hideLoading();
                    if(res.message) {
                        for(var msgIdx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[msgIdx].id==res.message.id) {
                                $scope.data.trollboxMessages.items[msgIdx]=res.message;
                            }
                        }
                    }
                    modal.alert({message:res.result});
                },function(){
                    kendo.mobile.application.hideLoading();
                });
        }

        $scope.data.trollboxVoteUp=function(message) {
            $rootScope.showInterstitialAdMob(function(result) {
                if (result) {
                    trollboxVote(message,1);
                }
            });
        };

        $scope.data.trollboxVoteDown=function(message) {
            trollboxVote(message,-1);
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

        $scope.data.trollboxAcceptMessage=function(message) {
            jsonPostDataPromise('/ext-api-moderator/accept-trollbox-message', {id: message.id})
                .then(function (res) {
                    if(res.result===true) {
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].id==message.id) {
                                $scope.data.trollboxMessages.items[idx]=res.trollboxMessage;
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
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].id==message.id) {
                                $scope.data.trollboxMessages.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };

        $scope.data.showVideo = function(message) {
            uploadService.showMedia(message.file, 'VIDEO', message.id);
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

        $scope.data.trollboxBlockUser=function(message) {
            modal.confirmYesCancel({message:gettextCatalog.getString('Willst Du wirklich den Benutzer für alle Foren sperren?')}).then(function(result){
                if (result!==1) return;

                jsonPostDataPromise('/ext-api-moderator/block-user-in-trollbox-with-message',{groupChatId:message.id,userId:message.user.id}).then(function(data){
                    if (data.result===true) {
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].user.id==message.user.id) {
                                $scope.data.trollboxMessages.items[idx].user.is_blocked_in_trollbox=1;
                            }
                            if ($scope.data.trollboxMessages.items[idx].id==message.id) {
                                $scope.data.trollboxMessages.items[idx]=data.trollboxMessage;
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
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].user.id==message.user.id) {
                                $scope.data.trollboxMessages.items[idx].user.is_blocked_in_trollbox=0;
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
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].id==message.id) {
                                $scope.data.trollboxMessages.items[idx]=res.trollboxMessage;
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
                        for(var idx in $scope.data.trollboxMessages.items) {
                            if ($scope.data.trollboxMessages.items[idx].id==message.id) {
                                $scope.data.trollboxMessages.items[idx]=res.trollboxMessage;
                            }
                        }
                    } else {
                        modal.alert({message:res.result});
                    }
                });
        };


        $scope.data.trollboxMessageDelete = function(id) {
            modal.confirmYesCancel({message:gettextCatalog.getString('Willst Du Deinen Beitrag wirklich löschen?')}).then(function(result) {
                if (result!==1) return;

                jsonPostDataPromise('/ext-api-trollbox/delete',{id: id})
                    .then(function (data) {
                        if (data.result===true) {
                            for (var idx in $scope.data.trollboxMessages.items) {
                                if ($scope.data.trollboxMessages.items[idx].id == id) {
                                    $scope.data.trollboxMessages.items[idx].status = 'DELETED';
                                }
                            }
                        }
                    });
            });
        };

        $rootScope.$on('trollboxMessageUpdateData',function(event,data){
            for (var idx in $scope.data.trollboxMessages.items) {
                if ($scope.data.trollboxMessages.items[idx].id == data.trollboxMessage.id) {
                    var tmp=angular.copy($scope.data.trollboxMessages.items[idx]);
                    tmp.text = data.trollboxMessage.text;
                    tmp.file = data.trollboxMessage.file;
                    tmp.trollbox_category_id = data.trollboxMessage.trollbox_category_id;
                    tmp.trollbox_category = data.trollboxMessage.trollbox_category;
                    $scope.data.trollboxMessages.items[idx]=tmp;
                }
            }
        });

        $scope.data.sortFriends=function (field) {
            if ($scope.data.friends.sort==field) {
                $scope.data.friends.sort='-'+field;
                $scope.data.friends.pageNum=1;
                $scope.data.friendsLoad();
                return;
            }
            if ($scope.data.friends.sort=='-'+field) {
                $scope.data.friends.sort=field;
                $scope.data.friends.pageNum=1;
                $scope.data.friendsLoad();
                return;
            }
            $scope.data.friends.sort=field;
            $scope.data.friendsLoad();
        };

        $scope.data.showVideoIdentification = function() {
            $rootScope.infoPopup.showVideoIdentification=false;
            jsonDataPromise('/ext-api-trollbox/get-video-identification',{user_id: $scope.data.userInfo.id})
                .then(function(data){
                    $rootScope.trollboxMessage=data;
                    $rootScope.infoPopup.showVideoIdentification=true;
                    $timeout(function() {
                        $('#view-video-identification-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('videoIdentificationPopupResize');
                        }, 50);
                    });
                });


        };

        $scope.data.resetVideoident = function() {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('Beachte bitte:\nWenn Du dein IdentVideo neu aufnehmen möchtest, wird dein Identifikations-Status zurück gesetzt und Du musst erst wieder neu von unserer Community bestätigt werden.\n'),
                buttonArray: [
                    gettextCatalog.getString('Bestätigen'),
                    gettextCatalog.getString('Abbrechen')
                ]
            }).then(function(result) {
                if (result!=1) {
                    return;
                }

                jsonPostDataPromise('/ext-api-user-profile/reset-videoident').then(function(data) {
                    angular.extend($scope.data.userInfo, data.userInfo);
                    status.update();
                });

            });

        };

        $scope.data.spamReport=function(data) {
            $rootScope.$broadcast('spamReportPopup', data);
            $('#view-spam-report-popup').kendoMobileModalView('open');
        };
        
    }



});
