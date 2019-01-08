app.controller('CounterUserFeedbackUpdateCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            id: {},
            feedback: {}
        };

        $scope.data.onOpen = function(kendoEvent) {

            $scope.data.search_request_offer_id=kendoEvent.target.attr('data-search-request-offer-id');
            $scope.data.offer_request_id=kendoEvent.target.attr('data-offer-request-id');

            $scope.data.feedback.rating = {};
            $scope.data.feedback.feedback = '';

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-feedback/counter-update', {
                    search_request_offer_id: $scope.data.search_request_offer_id,
                    offer_request_id: $scope.data.offer_request_id
                })
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $rootScope.$broadcast('activityListUpdate',res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });

        };



        $scope.data.save = function() {

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-feedback/counter-save', {feedback: $scope.data.feedback})
                    .then(function (res) {
                        if(res.result) {
                            $('#deals-completed-update-counter-user-feedback-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();

                            var params = {
                                search_request_offer_id: $scope.data.search_request_offer_id,
                                offer_request_id: $scope.data.offer_request_id,
                                rating: $scope.data.feedback.rating
                            };

                            $rootScope.$broadcast('counterRatingUpdateParams', params);

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