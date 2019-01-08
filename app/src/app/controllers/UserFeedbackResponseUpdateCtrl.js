app.controller('UserFeedbackResponseUpdateCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            feedback: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.feedback.response = '';

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-feedback/response-update', {
                    id:kendoEvent.target.attr('data-id')
                })
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.save = function() {

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-feedback/response-save', {feedback: $scope.data.feedback})
                    .then(function (res) {
                        if(res.result) {
                            $('#view-user-feedback-response-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                            $rootScope.$broadcast('UserFeedbackResponse',res.feedback);
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