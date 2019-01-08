app.controller('OfferDetailCtrl', function ($scope,jsonDataPromise, $rootScope, $timeout, $interval, messengerService, jsonPostDataPromise, modal, gettextCatalog) {

    function doRequest() {
        if ($scope.data.offer.type=='AUCTION') {
            kendo.mobile.application.navigate('view-offers-bet.html?offer_id='+$scope.data.offer.id);
            return;
        }

        if ($scope.data.offer.type=='AUTOSELL') {
            modal.confirmYesCancel(gettextCatalog.getString('„Mit OK bestätigst Du den verbindlichen Kauf des Angebots.“')).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    jsonPostDataPromise('/ext-api-offer-request/save',{offerRequest:{offer_id:$scope.data.offer.id}})
                        .then(function (data) {
                            if (data.result!==true) {
                                modal.alert({message:data.result});
                            } else {
                                kendo.mobile.application.navigate('view-offer-pay.html?id='+data.offerRequest.id);
                            }
                        });
                }
            });
        }
    }


    if (!$scope.data) {

        $scope.$on('spamReported',function() {
            $scope.data.offer.spamReported=true;
        });

        $scope.data={
            offer: {}
        };

        var timeoutPromise = null;
        var intervalPromise = null;

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.offer = {};

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-offer/details',{id:kendoEvent.view.params.id,noViewBonus:kendoEvent.view.params.noViewBonus})
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        if (angular.isString(res.offer.viewBonusCode)) {
                            var params = {
                                offer_id: res.offer.id,
                                view_bonus: res.offer.view_bonus,
                                viewBonusCode: res.offer.viewBonusCode
                            };

                            timeoutPromise=$timeout(function(){
                                $('#offers-details-view-bonus-popup').kendoMobileModalView('open');
                                $rootScope.$broadcast('offerDetailsViewBonusPopup', params);
                            }, $scope.data.offer.viewBonusDelay*1000);
                        }

                        if($scope.data.offer && $scope.data.offer.offer_view_log_id) {
                            intervalPromise=$interval(function(){
                                jsonDataPromise('/ext-api-offer-view-log/update',{id: $scope.data.offer.offer_view_log_id}).then(function (data) {
                                    $scope.data.offer.count_offer_view = data.count_offer_view;
                                },function(){});
                            },5*1000);
                        }

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });

        };

        $scope.data.request=function() {
            if ($scope.data.offer.userAccepted) {
                modal.confirmYesCancel({message:gettextCatalog.getString('Du hast bereits auf diesen Artikel geboten, bist du dir sicher, dass du ein weiteres Gebot abgeben möchtest?')}).then(function(buttonIndex) {
                    if (buttonIndex==1) {
                        doRequest();
                    }
                });
            } else {
                doRequest();
            }
        };
        /*
        $scope.data.requestAutoAccept=function() {
                modal.confirmYesCancel(gettextCatalog.getString('„Mit OK bestätigst Du den verbindlichen Kauf des Angebots.“')).then(function(buttonIndex) {
                    if (buttonIndex==1) {
                        jsonPostDataPromise('/ext-api-offer-request/save',{offerRequest:{offer_id:$scope.data.offer.id}})
                            .then(function (data) {
                                if (data.result!==true) {
                                    modal.alert({message:data.result});
                                } else {
                                    kendo.mobile.application.navigate('view-offer-pay.html?id='+$scope.data.offer.id);
                                }
                            });
                    }
                });
        };
        */

        $scope.data.onHide = function(kendoEvent) {
            $timeout.cancel(timeoutPromise);

            if($scope.data.offer && $scope.data.offer.offer_view_log_id) {
                $interval.cancel(intervalPromise);
                jsonDataPromise('/ext-api-offer-view-log/end-view',{id: $scope.data.offer.offer_view_log_id}).then(function (data) {},function(){});
            }
        };

        $scope.data.openChat=function() {
            messengerService.addSystemMessage($scope.data.offer.user.id,'/ext-api-offer/open-chat',angular.copy({offer:$scope.data.offer}));
            kendo.mobile.application.navigate('view-chat.html?id='+$scope.data.offer.user.id);
        };

        $scope.data.spamReport=function(data) {
            $rootScope.$broadcast('spamReportPopup', data);
            $('#view-spam-report-popup').kendoMobileModalView('open');
        };

        $scope.data.addFavorite = function(id) {
            jsonPostDataPromise('/ext-api-favorites/add',{id:id, type:'offer'})
                .then(function (data) {
                    if (data.result===true) {
                        $scope.data.offer.favorite = true;
                    }
                });
        };

        $scope.data.showGallery = function(index, images) {
            $rootScope.imagesGallery = {
                'index': index,
                'images': images
            };
            kendo.mobile.application.navigate('view-photoswipe.html?isGallery=true');
        };

        $scope.data.openAgb = function() {
            modal.alert({
                title: gettextCatalog.getString('AGB'),
                message: $scope.data.offer.user.agb
            });
        };



    }


});
