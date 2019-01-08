app.controller('SearchRequestSearchCtrl', function ($scope,jsonDataPromise, $rootScope, jsonPostDataPromise) {

    if (!$scope.data) {
        $scope.filter = {};

        $scope.data={
            log: {
				countryArraySearchRequestSearch:[{}],//nviimedia
                filter:{
					country:[] //nviimedia
				},
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $rootScope.$on('log.filterSearch', function(event, data) {
            angular.extend($scope.data.log.filter, data);
        });

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue != oldValue) {
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $scope.data.log.refresh();
				
				/*nviimedia*/
				if($scope.data.log.filter.country.length===0){
					//get information from Extapi only from the user country 
					if($rootScope.status.user.country_id){
						jsonDataPromise('/ext-api-country/get-country-list-searches',{ids:$rootScope.status.user.country_id})
							.then(function (country_count) {
							if(country_count){
								$scope.data.log.filter.country = [{id:$rootScope.status.user.country_id,name:country_count[0].name,flag:country_count[0].flag}];	
							}
						});
					}
				}
				/*nviimedia*/
				$scope.labels=$rootScope.status.labels;
				
                $rootScope.refreshFlag=false;
            }
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

            var params= {
                filter: data.filter,
                pageNum: data.pageNum
            };

            jsonDataPromise('/ext-api-search-request-search-new/search', params)
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.results.items = data.items.concat(res.results.items);
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

            jsonPostDataPromise('/ext-api-favorites/add',{id:id, type:'search_request'})
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
            $rootScope.$broadcast('log.filterSearchClean', 'requestSearch');
        };



    }
});
