app.controller('ManageSelectDestinationCtrl', function ($scope,status,jsonDataPromise,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data={
            user: {},
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
            $scope.data.user = {};
            $scope.data.move_id = kendoEvent.view.params.move_id;
            $scope.data.id=kendoEvent.view.params.id ? kendoEvent.view.params.id:null;

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-manage-network/move-destination-list',{
                    id: $scope.data.id,
                    move_id: $scope.data.move_id,
                    pageNum: 1
                }).then(function (res) {
                    angular.extend($scope.data.user,res.user);
                    angular.extend($scope.data.users,res.users);
                    kendo.mobile.application.hideLoading();
                },function(){
                    kendo.mobile.application.hideLoading();
                });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };

        $scope.data.getHierarchy = function(id) {
            kendo.mobile.application.navigate('view-manage-select-destination.html?move_id='+$scope.data.move_id+'&id='+id);
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
                id:$scope.data.id,
                move_id: $scope.data.move_id,
                pageNum: data.pageNum,
                filter: data.filter
            };

            jsonPostDataPromise('/ext-api-manage-network/hierarchy-list', params)
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