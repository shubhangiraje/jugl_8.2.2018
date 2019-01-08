app.controller('ManageNetworkCtrl', function ($scope,jsonPostDataPromise,$timeout) {
    if (!$scope.data) {

        $scope.data={
            users: {
                filter:{},
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
            $scope.data.users.refresh();
        };

        $scope.$watch('data.users.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.users.items=[];
                $scope.data.users.refresh();
            }
        },true);

        $scope.data.users.refresh=function() {
            $scope.data.users.pageNum=1;
            $scope.data.users.hasMore=false;
            $scope.data.users.load();
        };

        $scope.data.users.loadMore=function() {
            var data=$scope.data.users;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.userSearch = function() {
            $scope.data.users.items=[];
            $scope.data.users.refresh();
        };

        $scope.data.users.load = function() {
            var data=$scope.data.users;
            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }
            data.loading=true;

            var params= {
                filter: data.filter,
                pageNum: data.pageNum
            };

            jsonPostDataPromise('/ext-api-manage-network/list', params)
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

    }

});