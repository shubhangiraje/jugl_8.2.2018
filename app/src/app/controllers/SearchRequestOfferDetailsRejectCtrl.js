app.controller('SearchRequestOfferDetailsRejectCtrl', function (modal,$rootScope,$scope,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data = {
            id: {},
            reject: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.id = kendoEvent.target.attr('data-id');
            $scope.data.reject.reject_reason = {};
            $scope.data.reject.reject_comment = '';
        };

        $scope.data.save = function() {
            var params = {
                id: $scope.data.id,
                reject: $scope.data.reject
            };

            $timeout(function() {
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-search-request-offer/reject', params)
                    .then(function (res) {
                        if (res.result) {
                            kendo.mobile.application.hideLoading();
                            $('#search-request-offer-reject-popup').kendoMobileModalView("close");
                            $rootScope.refreshFlag = true;
                            kendo.mobile.application.navigate('view-searches-my-list.html');
                        } else {
                            modal.showErrors(res.reject.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    }, function () {
                        kendo.mobile.application.hideLoading();
                    });
            });

        };


    }


});
