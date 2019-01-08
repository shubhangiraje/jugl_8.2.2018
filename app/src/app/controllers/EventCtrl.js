app.controller('EventCtrl', function ($timeout,$scope,$rootScope,jsonDataPromise,jsonPostDataPromise,status,modal,gettextCatalog,$log,infoPopup) {

    function refreshIfActive() {
        $log.debug('auto refresh activities log');
        if (kendo.mobile.application.view().id=='view-activities.html') {
            $scope.data.log.refresh();
        }
    }

    if (!$scope.data) {

        $scope.data={
            log: {
                filter:{
                    type: ''
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            },
            dateTimeFormat: gettextCatalog.getString("dd MMMM 'um' HH:mm"),
            mode: 'event'
        };

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



        $rootScope.$on('activityListUpdate',function(event,data) {
            for(var eventIdx in data.events) {
                for(var idx in $scope.data.log.items) {
                    if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                        var t=angular.copy($scope.data.log.items[idx]);
                        angular.extend(t,data.events[eventIdx]);
                        $scope.data.log.items[idx]=t;
                        break;
                    }
                }
            }
        });
        
        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.log.filter.type='';
            $scope.data.mode = 'event';
            //status.update();
            $scope.data.log.refresh();
        };

        $scope.data.toggleBlockParentTeamRequests=function() {
            jsonPostDataPromise('/ext-api-base/toggle-block-parent-team-requests').then(function(data){
                if (data.result===true) {
                    status.update();
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.networkRejectMoving=function(fromId,toId,userId) {
            jsonPostDataPromise('/ext-api-manage-network/reject-moving',{fromId:fromId,toId:toId,userId:userId}).then(function(data){
                if (data.result===true) {
                    for(var eventIdx in data.events) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.events[eventIdx]);
                                $scope.data.log.items[idx]=t;
                                break;
                            }
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.networkAcceptMoving=function(fromId,toId,userId) {
            jsonPostDataPromise('/ext-api-manage-network/accept-moving',{fromId:fromId,toId:toId,userId:userId}).then(function(data){
                if (data.result===true) {
                    for(var eventIdx in data.events) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.events[eventIdx]);
                                $scope.data.log.items[idx]=t;
                                break;
                            }
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.stickParentReject=function() {
            jsonPostDataPromise('/ext-api-user-profile/stick-parent-reject',{}).then(function(data){
                if (data.result===true) {
                    for(var eventIdx in data.events) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.events[eventIdx]);
                                $scope.data.log.items[idx]=t;
                                break;
                            }
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.stickParentAccept=function() {
            jsonPostDataPromise('/ext-api-user-profile/stick-parent-accept',{}).then(function(data){
                if (data.result===true) {
                    for(var eventIdx in data.events) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.events[eventIdx]);
                                $scope.data.log.items[idx]=t;
                                break;
                            }
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.spamReportDeactivate=function(event_id,id) {
            modal.confirmYesCancel({message:gettextCatalog.getString('Möchten sie wirklich Spammeldung zurücknehmen?')}).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    jsonPostDataPromise('/ext-api-spam-report/deactivate',{id:id,event_id:event_id}).then(function(data){
                        if (data.result===true) {
                            for(var eventIdx in data.events) {
                                for(var idx in $scope.data.log.items) {
                                    if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                        var t=angular.copy($scope.data.log.items[idx]);
                                        angular.extend(t,data.events[eventIdx]);
                                        $scope.data.log.items[idx]=t;
                                        break;
                                    }
                                }
                            }

                            //modal.alert({message:gettextCatalog.getString('Geldeingang wurde erfolgreich bestätigt')});
                        } else {
                            modal.alert({message:data.result});
                        }
                    });
                }
            });
        };

        $scope.data.userTeamRequestAccept=function(fromUserId) {
            function processAccept() {
                jsonPostDataPromise('/ext-api-user-team-request/accept',{fromUserId:fromUserId}).then(function(data){
                    if (data.result===true) {
                        for(var eventIdx in data.events) {
                            for(var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                    var t=angular.copy($scope.data.log.items[idx]);
                                    angular.extend(t,data.events[eventIdx]);
                                    $scope.data.log.items[idx]=t;
                                    break;
                                }
                            }
                        }

                        //                modal.alert({message:gettextCatalog.getString('Geldeingang wurde erfolgreich bestätigt')});
                    } else {
                        modal.alert({message:data.result});
                    }
                });
            }

            jsonDataPromise('/ext-api-user-team-request/get-type',{fromUserId:fromUserId}).then(function(data) {
                if (data.result === true) {
                    if (data.type=='PARENT_TO_REFERRAL') {
                        modal.confirmChangeTeam({message: gettextCatalog.getString('Achtung! Durch die Annahme dieser Teamanfrage verlässt Du Dein aktuelles Team. Tu dies nur, wenn Du mit Deinem aktuellen Teamleiter unzufrieden bist.')}).then(function (buttonIndex) {
                            if (buttonIndex == 1) {
                                processAccept();
                            }
                        });
                    } else {
                        processAccept();
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        };

        $scope.data.userTeamRequestDecline=function(fromUserId) {
            //modal.confirmYesCancel({message:gettextCatalog.getString('Möchten sie wirklich Annehmen?')}).then(function(buttonIndex) {
            //if (buttonIndex==1) {
            jsonPostDataPromise('/ext-api-user-team-request/decline',{fromUserId:fromUserId}).then(function(data){
                if (data.result===true) {
                    for(var eventIdx in data.events) {
                        for(var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id==data.events[eventIdx].id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.events[eventIdx]);
                                $scope.data.log.items[idx]=t;
                                break;
                            }
                        }
                    }

                    //                modal.alert({message:gettextCatalog.getString('Geldeingang wurde erfolgreich bestätigt')});
                } else {
                    modal.alert({message:data.result});
                }
            });
            //}
            //});
        };

        $scope.data.offerRequestPayNotifyBuyer=function(id) {
            kendo.mobile.application.showLoading();
            jsonDataPromise('/ext-api-offer-request/payment-complaint',{id:id}).then(function(data){
                kendo.mobile.application.hideLoading();

                $('#offer-request-payment-complaint-popup').kendoMobileModalView('open');
                $rootScope.$broadcast('OfferRequestPaymentComplaintPopupCtrlData',data.paymentComplaint);
            },function(data){
                kendo.mobile.application.hideLoading();
            });
        };

        $scope.data.gotoProfile=function(id) {
            if (!id) return;
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $scope.data.log.refresh=function() {
            $scope.data.log.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.log.load();
        };

        $scope.data.log.loadMore=function() {
            var data=$scope.data.log;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.log.load = function() {
            var data=$scope.data.log;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise($scope.data.mode=='event' ? '/ext-api-event/log' : '/ext-api-follower-event/log', {
                type: data.filter.type,
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };


        $scope.data.goMyOfferRequest = function(param) {
            var offerRequestId = param.id;
            $rootScope.refreshFlag = true;
            kendo.mobile.application.navigate('#view-offers-my.html?offerRequestId='+offerRequestId);
        };

        $scope.data.goMyOffer = function(param) {
            var offerId = param.id;
            $rootScope.refreshFlag = true;
            kendo.mobile.application.navigate('#view-offers-my.html?offerId='+offerId);
        };

        $rootScope.$on('statusUpdateRequested',refreshIfActive);
        document.addEventListener("resume", refreshIfActive);


        $scope.data.changeMode = function(mode) {
            switch (mode) {
                case 'event':
                    $scope.data.mode='event_follower';
                    break;
                case 'event_follower':
                    $scope.data.mode='event';
                    break;
            }
            $scope.data.log.filter.type='';
            $scope.data.log.refresh();
        };

        $scope.data.goInfoView = function(view) {
            if(view=='view-funds-web') view = 'view-funds-app';
            var route = infoPopup.getInfoViewNavigate(view, status.user.id);
            kendo.mobile.application.navigate('#'+route);
            infoPopup.show(view);
        };

    }
});
