app.controller('FavoritesCtrl', function ($scope,jsonDataPromise, modal, jsonPostDataPromise, gettextCatalog) {

    if (!$scope.data) {

        $scope.data={
            log: {
                filter:{
                    type: ''
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };



        $scope.data.delete = function(id, type) {
            modal.confirmYesCancel(gettextCatalog.getString('Delete favorite?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-favorites/delete', {id: id, type: type})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result===true) {
                            for (var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id == id) {
                                    $scope.data.log.items.splice(idx, 1);
                                }
                            }
                        }
                    });

            });
        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.log.refresh();
        };

        $scope.data.log.refresh=function() {
            $scope.data.log.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.log.load();
        };

        $scope.data.log.loadMore=function() {
            var data=$scope.data.log;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.log.load = function() {
            var data=$scope.data.log;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-favorites/search', {
                filter: data.filter,
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.log.items = data.items.concat(res.log.items);
                    }

                    angular.extend(data, res.results);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        //$scope.state.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };
    }



});
