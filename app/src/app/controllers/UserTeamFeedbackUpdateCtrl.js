app.controller('UserTeamFeedbackUpdateCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            feedback: {}
        };

        $scope.data.close = function() {
            if ($scope.data.feedback.isNotification) {
                jsonPostDataPromise('/ext-api-user-team-feedback/notification-rejected')
                    .then(function (data) {
                        if (data.result) {
                            $('#view-user-team-feedback-popup').kendoMobileModalView('close');
                        }
                    });
            } else {
                $('#view-user-team-feedback-popup').kendoMobileModalView('close');
            }
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.feedback.rating = {};
            $scope.data.feedback.feedback = '';

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-team-feedback/update', {
                })
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        if (kendoEvent && kendoEvent.isNotification) {
                            $scope.data.feedback.isNotification=true;
                        }
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.$on('UserTeamFeedbackUpdateOpen',function(event,data){
            $scope.data.onOpen(data);
        });

        $scope.data.save = function() {

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-team-feedback/save', {feedback: $scope.data.feedback})
                    .then(function (res) {
                        if(res.result) {
                            $('#view-user-team-feedback-popup').kendoMobileModalView("close");
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