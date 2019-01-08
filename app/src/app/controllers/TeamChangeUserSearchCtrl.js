app.controller('TeamChangeUserSearchCtrl', function ($scope,jsonPostDataPromise,status,$rootScope) {

    if (!$scope.data) {
        $scope.filter={};

        $scope.data={
            users: {
                filter:{
                    status: 0
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false,
                searchUserCount: 0
            }
        };

        $rootScope.$on('userTeamRequestAdded',function(event,user_id) {
            for(var userIdx in $scope.data.users.items) {
                var item=$scope.data.users.items[userIdx];
                if (item.id==user_id) {
                    var newItem=angular.copy(item);
                    newItem.invitation_sent=true;
                    $scope.data.users.items[userIdx]=newItem;
                }
            }
        });

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
            status.update();
        };

        /*
        $scope.$watch('data.users.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.users.items=[];
                $scope.data.users.refresh();
            }
        },true);
        */

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

            jsonPostDataPromise('/ext-api-team-change-user-search/users', params)
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    if (data.pageNum==1) {
                        delete data.items;
                    }

                    angular.extend(data, res);

                    if (data.pageNum==1) {
                        data.showResults=!!data.items;
                    }

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
