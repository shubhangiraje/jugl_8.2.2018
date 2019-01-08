app.controller('OfferMyListCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,status,$rootScope,modal,gettextCatalog,$timeout,messengerService) {

    if (!$scope.data) {

        $scope.data={
            log: {
                filter:{
                    status: ''
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $scope.data.log.refresh();

                if(kendoEvent.view.params.offerRequestId) {
                    $scope.data.offerRequestId = kendoEvent.view.params.offerRequestId;
                }

                if(kendoEvent.view.params.offerId) {
                    $scope.data.offerId = kendoEvent.view.params.offerId;
                }

                $rootScope.refreshFlag=false;
            }

            if(kendoEvent.view.params.filter) {
                $scope.data.log.filter.status = kendoEvent.view.params.filter;
            }

        };

        $scope.data.offerRequestFilters = {
            'ACTIVE':{isExpired:false},
            'EXPIRED':{isExpired:true}
        };

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.openChat=function(offerRequest,offer) {
            //messengerService.addSystemMessage(offerRequest.user.id,'/ext-api-offer/open-chat-expired',angular.copy({offerRequestId:offerRequest.id}));
            kendo.mobile.application.navigate('view-chat.html?id='+offerRequest.user.id+'&message='+encodeURIComponent(gettextCatalog.getString('Kannst Du Dein Gebot für das Angebot "{{title}}" bitte noch einmal wiederholen? Ich würde es gerne annehmen.',{title:offer.title})));
        };

        $scope.data.accept=function(offerRequest,offer) {
            jsonPostDataPromise('/ext-api-offer-request/accept',{id:offerRequest.id})
                .then(function (data) {
                    if (data.result===true) {
                        jsonDataPromise('/ext-api-offer-my-list/list',{filter:{id:offer.id},pageNum:1}).then(function(data){
                            for (var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id == data.results.items[0].id) {
                                    $scope.data.log.items[idx]=data.results.items[0];
                                }
                            }
                        });
                        modal.alert(gettextCatalog.getString('Du hast erfolgreich einen Kaufinteressenten akzeptiert. Er wurde benachrichtigt'));
                        kendo.mobile.application.view().scroller.scrollTo(0, 0);
                    } else {
                        modal.alert(data.result);
                    }
                });
        };

        $scope.data.delete = function(id) {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('Willst du Dein Angebot endgültig löschen?'),
                title: gettextCatalog.getString('Inserat löschen')
            }).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-offer/delete',{id:id})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result===true) {
                            for (var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id == id) {
                                    $scope.data.log.items.splice(idx, 1);
                                }
                            }
                        }
                    });
            });
        };


        $scope.data.pause=function(id) {
            jsonPostDataPromise('/ext-api-offer/pause',{id:id})
                .then(function (data) {
                    if (data.result===true) {
                        for (var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id == data.offer.id) {
                                var t=angular.copy($scope.data.log.items[idx]);
                                angular.extend(t,data.offer);
                                $scope.data.log.items[idx]=t;
                            }
                        }
                    } else {
                        modal.alert(data.result);
                    }
                });
        };

        $scope.$on('offerUpdate',function(event,data) {
            for (var idx in $scope.data.log.items) {
                if ($scope.data.log.items[idx].id == data.id) {
                    var t=angular.copy($scope.data.log.items[idx]);
                    angular.extend(t,data);
                    $scope.data.log.items[idx]=t;
                }
            }
        });

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

            jsonDataPromise('/ext-api-offer-my-list/list', {
                filter: data.filter,
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.results.items = data.items.concat(res.results.items);
                    }

                    angular.extend(data, res.results);

                    if($scope.data.offerRequestId) {
                        for (var idx in $scope.data.log.items) {
                            for (var idy in $scope.data.log.items[idx].offerRequests) {
                                if($scope.data.log.items[idx].offerRequests[idy].id == $scope.data.offerRequestId){
                                    $scope.data.log.items[idx].show_auction_list = true;
                                }
                            }
                        }

                        $timeout(function() {
                            var top = $('#offerRequest-'+$scope.data.offerRequestId).offset().top;
                            var offsetHeight = isAndroid() ? $('.km-footer').height(): $('.km-header').height();
                            $('.km-content:visible').data('kendoMobileScroller').scrollTo(0, -(top-offsetHeight));
                            $scope.data.offerRequestId = null;
                        });

                    }

                    if($scope.data.offerId) {
                        $timeout(function() {
                            var top = $('#offer-'+$scope.data.offerId).offset().top;
                            var offsetHeight = isAndroid() ? $('.km-footer').height(): $('.km-header').height();
                            $('.km-content:visible').data('kendoMobileScroller').scrollTo(0, -(top-offsetHeight));
                            $scope.data.offerId = null;
                        });
                    }


                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }

                },function(){
                    data.loading=false;
                });
        };

        /*jshint -W083 */
        $scope.data.offerViewUsers = function(id) {
            for (var idx in $scope.data.log.items) {
                if($scope.data.log.items[idx].id == id) {
                    $scope.data.log.items[idx].offer_view_users_loader = true;
                    $scope.data.log.items[idx].offer_view_users_load = false;
                    jsonDataPromise('/ext-api-offer-view-log/get-users',{offer_id:id})
                        .then(function (data) {
                            $scope.data.log.items[idx].offer_view_users = data;
                            $scope.data.log.items[idx].offer_view_users_loader = false;
                            $scope.data.log.items[idx].offer_view_users_load = true;
                        });
                    break;
                }
            }

        };
        /*jshint +W083 */

    }

    $rootScope.$on("update-offers-my-list",function(){
        $scope.data.log.refresh();
    });



});
