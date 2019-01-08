app.controller('TeamChangeRequestPopup2Ctrl', function ($scope,jsonPostDataPromise,$timeout,$rootScope,modal,status,gettextCatalog) {

    if (!$scope.data) {

        $scope.data = {
            userTeamRequest: {}
        };
        
        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.userTeamRequest.text='';
            $scope.data.userTeamRequest.user={name:kendoEvent.target.attr('data-user-name')};
            $scope.data.userTeamRequest.second_user_id=kendoEvent.target.attr('data-user-id');
        };

        $scope.data.save = function() {

            var params = {
                userTeamRequest: $scope.data.userTeamRequest
            };

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-team-request/save-parent-to-referral', params)
                    .then(function (res) {
                        if(res.result) {
                            kendo.mobile.application.hideLoading();
                            $('#team-change-request-popup2').kendoMobileModalView('close');
                            $rootScope.$broadcast('userTeamRequestAdded2',params.userTeamRequest.second_user_id);
                        } else {
                            modal.showErrors(res.userTeamRequest.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }


});