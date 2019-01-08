app.controller('NetworkChangeBlockPopupCtrl', function ($rootScope,$scope,jsonPostDataPromise,modal,$timeout) {
    if (!$scope.data) {

        $scope.data = {};

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.stickUserRequest.user_id=kendoEvent.target.attr('data-user-id');
        };

        $scope.data.send = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-profile/save-stick-request', {stickUserRequest:$scope.data.stickUserRequest})
                    .then(function (res) {
                        if(res.result) {
                            kendo.mobile.application.hideLoading();
                            $('#view-network-change-block-popup').kendoMobileModalView('close');
                            modal.alert(res.result);
                            $rootScope.$broadcast('stickUserRequestSent',$scope.data.stickUserRequest.user_id);
                        } else {
                            modal.showErrors(res.stickUserRequest.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };
    }

    $scope.data.stickUserRequest={};
});