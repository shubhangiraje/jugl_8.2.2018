app.controller('OfferRequestPaymentComplaintPopupCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            paymentComplaint: {}
        };

        $rootScope.$on('OfferRequestPaymentComplaintPopupCtrlData',function(event,data) {
            $scope.data.paymentComplaint=data;
        });

        $scope.data.save = function() {

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-offer-request/payment-complaint-save', {paymentComplaint: $scope.data.paymentComplaint})
                    .then(function (res) {
                        kendo.mobile.application.hideLoading();
                        if(res.result) {
                            $rootScope.$broadcast('activityListUpdate', res);
                            $('#offer-request-payment-complaint-popup').kendoMobileModalView('close');
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };


    }


});