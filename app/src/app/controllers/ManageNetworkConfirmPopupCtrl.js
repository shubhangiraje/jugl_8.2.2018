app.controller('ManageNetworkConfirmPopupCtrl', function ($scope,jsonPostDataPromise,modal) {
    if (!$scope.data) {

        $scope.data = {
            users: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.users.src_id=kendoEvent.target.attr('data-src-id');
            $scope.data.users.src_name=kendoEvent.target.attr('data-src-name');
            $scope.data.users.dst_id=kendoEvent.target.attr('data-dst-id');
            $scope.data.users.dst_name=kendoEvent.target.attr('data-dst-name');
        };

        $scope.data.save = function() {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-manage-network/save',{
                moveId:$scope.data.users.src_id,
                dstId:$scope.data.users.dst_id
            }).then(function (res) {
                    kendo.mobile.application.hideLoading();
                    $('#view-manage-network-confirm-popup').kendoMobileModalView('close');
                    modal.alert({message:res.result}).then(function () {
                        kendo.mobile.application.navigate('view-dashboard.html');
                    });
                },function(){
                    kendo.mobile.application.hideLoading();
                });

        };

    }
});