app.controller('OfferSearchByUserCtrl', function ($scope,jsonDataPromise,$rootScope,jsonPostDataPromise) {

    if (!$scope.data) {

        $scope.filter = {};

        $scope.data={
            log: {
                filter:{},
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.userId = kendoEvent.view.params.id;
            $scope.data.log.refresh();
        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };


        $rootScope.$on('log.filterOfferByUser', function(event, data) {
            angular.extend($scope.data.log.filter, data);
        });

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.refresh();
            }
        },true);

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

            var params = {
                filter: data.filter,
                pageNum: data.pageNum,
                user_id: $scope.data.userId
            };

            jsonDataPromise('/ext-api-offer-search/search-by', params)
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res.results);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        $scope.data.addFavorite = function(id) {

            jsonPostDataPromise('/ext-api-favorites/add',{id:id, type:'offer'})
                .then(function (data) {
                    if (data.result===true) {
                        for (var idx in $scope.data.log.items) {
                            if ($scope.data.log.items[idx].id == id) {
                                $scope.data.log.items[idx].favorite = true;
                            }
                        }
                    }
                });

        };

        $scope.data.cleanFilter = function() {
            $scope.data.log.filter = {};
            $scope.data.log.refresh();
            $rootScope.$broadcast('log.filterOfferByUserClean', 'offerSearchByUser');
        };

    }

});
