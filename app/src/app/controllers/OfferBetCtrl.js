app.controller('OfferBetCtrl', function ($scope,jsonPostDataPromise,jsonDataPromise,modal,gettextCatalog,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data={
            offerBet: {}
        };

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.showLoading();

            jsonDataPromise('/ext-api-offer-request/bet-get',{
                offer_id:kendoEvent.view.params.offer_id,
                offer_request_id:kendoEvent.view.params.offer_request_id
            }).then(function(data) {
                angular.extend($scope.data,data);
                kendo.mobile.application.hideLoading();
            },function(){
                kendo.mobile.application.hideLoading();
            });
        };

        $scope.data.bet = function () {
            $scope.data.offerBet.saving = true;
            jsonPostDataPromise('/ext-api-offer-request/bet', {offerBet: $scope.data.offerBet}).then(function(data) {
                $scope.data.offerBet.saving = false;

                if (data.result===true) {
                    $rootScope.refreshFlag=true;
                    kendo.mobile.application.navigate('#view-offers-my-requests.html');
                    return;
                }
                if (data.price_is_not_best===true) {
                    $('#view-offers-bet-popup').kendoMobileModalView('open');
                    $rootScope.$broadcast('OfferBetPopup',{
                        ok: function() {
                            $('#view-offers-bet-popup').kendoMobileModalView('close');
                            $timeout(function(){
                                $scope.data.offerBet.dont_check_price=true;
                                $scope.data.bet();
                            });
                        },
                        cancel: function() {
                            $('#view-offers-bet-popup').kendoMobileModalView('close');
                        },
                        best_price: data.best_price,
                        price: $scope.data.offerBet.price
                    });
                    return;
                }
                if (angular.isArray(data.offerBet.$allErrors) && data.offerBet.$allErrors.length>0) {
                    $scope.data.offerBet.$errors = data.offerBet.$errors;
                    modal.showErrors(data.offerBet.$allErrors);
                }

            },function(){
                $scope.offerBet.saving = false;

            });
        };

    }

    $scope.data.offerBet={};
});