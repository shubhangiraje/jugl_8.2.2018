app.controller('OfferDetailsRequestCtrl', function ($scope,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data = {
            offerRequest: {
                offer_id: {}
            }
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.offerRequest.offer_id = kendoEvent.target.attr('data-id');

        };

        $scope.data.save = function() {

            var params = {
                offerRequest: {
                    offer_id: $scope.data.offerRequest.offer_id,
                    description: $scope.data.offerRequest.description
                }
            };

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-offer-request/save', params)
                    .then(function (res) {
                        if(res.result) {
                            kendo.mobile.application.navigate('view-offers-search.html');
                            kendo.mobile.application.hideLoading();
                        } else {
                            modal.showErrors(res.feedback.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }


});