app.controller('OfferMyListAcceptCtrl', function (modal,$rootScope,$scope,jsonPostDataPromise,status,$timeout) {

    if (!$scope.data) {

        $scope.data = {
            id: {},
            feedback: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.id = kendoEvent.target.attr('data-id');
            $scope.data.feedback.rating = {};
            $scope.data.feedback.feedback = '';
        };

        $scope.data.saveAccept = function() {

            var params = {
                id: $scope.data.id,
                feedback: $scope.data.feedback
            };

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-offer-request/accept', params)
                    .then(function (res) {
                        if(res.result) {
                            status.update();
                            $('#offers-accept-popup').kendoMobileModalView("close");
                            $rootScope.$broadcast("update-offers-my-list");
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