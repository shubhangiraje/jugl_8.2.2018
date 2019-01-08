app.controller('ProfileCtrl', function ($scope, jsonDataPromise, $timeout) {

    if (!$scope.data) {

        $scope.data={

        };

        $scope.data.onShow = function(kendoEvent) {
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-profile/index')
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
                kendoEvent.view.scroller.scrollTo(0, 0);

            },0);
        };



    }

});