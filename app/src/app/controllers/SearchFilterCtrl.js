app.controller('SearchFilterCtrl', function ($scope,jsonDataPromise,$rootScope,$timeout) {

    if (!$scope.data) {
        $scope.filter = {};

        $scope.data={
            filter: {
                level1_interest_id:0,
                level2_interest_id:0,
                level3_interest_id:0,
                params:{},
                sort:'',
				country:[] //nviimedia
            },
            filterData: {
                interests: [],
                params: []
            },
            emptyOption: {
                id: 0,
                title: ''
            },
            loading: false,
            historyTypeFilter: {},
            level1_interest_id_watch: true,
            level2_interest_id_watch: true,
            userId: ''
        };

        $scope.$watch('data.filter.level1_interest_id',function(newValue,oldValue) {
            if (newValue != oldValue) {
                if ($scope.data.level1_interest_id_watch) {
                    $scope.data.filter.level2_interest_id = 0;
                } else {
                    $scope.data.level1_interest_id_watch = true;
                }
            }
        });

        $scope.$watch('data.filter.level2_interest_id',function(newValue,oldValue) {
            if (newValue != oldValue) {
                if ($scope.data.level2_interest_id_watch) {
                    $scope.data.filter.level3_interest_id = 0;
                } else {
                    $scope.data.level2_interest_id_watch = true;
                }
            }
        });

        $scope.data.init = function(type) {
            $scope.data.loading=true;
			
			
            switch (type) {
                case 'requestSearch':
				/*nviimedia*/
				
					//set Array for counting country specified offers
				$scope.data.countryArrayOfferSearch=[];
				//get information from Extapi
				$scope.labels=$rootScope.status.labels;
					jsonDataPromise('/ext-api-country/get-country-list-searches')
							.then(function (res) {
							//extend the empty array
							angular.extend($scope.data.countryArrayOfferSearch, res);
							//if country isn't set before
							if($scope.data.filter.country===undefined){
								//set country to Users country
								if($rootScope.status.user.country_id){
								$scope.data.filter.country = [{id:$rootScope.status.user.country_id}];	
								}
								
							}
							
					});
				/*nviimedia*/
				
                    jsonDataPromise('/ext-api-search-request-search-new/init-filter', {})
                        .then(function (res) {
                            $scope.data.loading=false;
                            angular.extend($scope.data.filterData, res);
                        },function(){
                            $scope.data.loading=false;
                        });
                    break;
                case 'offerSearch':
				
				/*nviimedia*/
				
					//set Array for counting country specified offers
				$scope.data.countryArrayOfferSearch=[];
				//get information from Extapi
					$scope.labels=$rootScope.status.labels;
					jsonDataPromise('/ext-api-country/get-country-list-offers')
							.then(function (res) {
							//extend the empty array
						
							angular.extend($scope.data.countryArrayOfferSearch, res);
							//if country isn't set before
							if($scope.data.filter.country===undefined){
								//set country to Users country
								if($rootScope.status.user.country_id){
								$scope.data.filter.country = [{id:$rootScope.status.user.country_id}];	
								}
								
							}
							
					});
				/*nviimedia*/

                    jsonDataPromise('/ext-api-offer-search-new/init-filter', {})
                        .then(function (res) {
                            $scope.data.loading=false;
                            angular.extend($scope.data.filterData, res);
                        },function(){
                            $scope.data.loading=false;
                        });
                    break;
            }

        };

        $scope.data.filterInterestComparator=function(actual, expected) {
            return actual === expected;
        };

        $scope.data.paramFilter=function(param) {
            // if themefinder is not specified, exit
            if (!$scope.data.filter.level3_interest_id) return false;

            if (param.interest_id===$scope.data.filter.level1_interest_id ||
                param.interest_id===$scope.data.filter.level2_interest_id ||
                param.interest_id===$scope.data.filter.level3_interest_id) {
                if (!$scope.data.filter.params[param.id]) {
                    $scope.data.filter.params[param.id]=0;
                }
                return true;
            }

            return false;
        };


        $scope.data.onShow=function(kendoEvent) {

            $scope.data.typeSearch = {};
            $scope.data.typeSearch = kendoEvent.view.params.type;
            $scope.data.userId = kendoEvent.view.params.id;

            var filterCleanData = {
                level1_interest_id:0,
                level2_interest_id:0,
                level3_interest_id:0,
                params:{},
				country:[{}]
            };

            $rootScope.$on('log.filterOfferClean', function(event, data) {
                $scope.data.historyTypeFilter[data] = filterCleanData;
            });

            $rootScope.$on('log.filterSearchClean', function(event, data) {
                $scope.data.historyTypeFilter[data] = filterCleanData;
            });

            $rootScope.$on('log.filterSearchByUserClean', function(event, data) {
                $scope.data.historyTypeFilter[data] = filterCleanData;
            });

            $rootScope.$on('log.filterOfferByUserClean', function(event, data) {
                $scope.data.historyTypeFilter[data] = filterCleanData;
            });

            if (angular.isDefined($scope.data.historyTypeFilter[$scope.data.typeSearch])) {
                $scope.data.level1_interest_id_watch = false;
                $scope.data.level2_interest_id_watch = false;
                $scope.data.filter = $scope.data.historyTypeFilter[$scope.data.typeSearch];
            } else {
                $scope.data.filter = {
                    level1_interest_id:0,
                    level2_interest_id:0,
                    level3_interest_id:0,
                    params:{}
                };
            }


            $scope.data.init($scope.data.typeSearch);

        };

        $scope.data.filterSearchRequest=function() {
            $scope.data.historyTypeFilter[$scope.data.typeSearch] = $scope.data.filter;
            switch($scope.data.typeSearch) {
                case 'offerSearch':
                    $rootScope.$broadcast('log.filterOffer', $scope.data.filter);
                    $timeout(function() {
                        kendo.mobile.application.replace('view-offers-search.html');
                    }, 300);
                    break;
                case 'offerSearchByUser':
                    $rootScope.$broadcast('log.filterOfferByUser', $scope.data.filter);
                    $timeout(function() {
                        kendo.mobile.application.replace('view-offers-search-by-user.html?id='+$scope.data.userId);
                    }, 300);
                    break;
                case 'requestSearch':
                    $rootScope.$broadcast('log.filterSearch', $scope.data.filter);
                    $timeout(function() {
                        kendo.mobile.application.replace('view-searches-search.html');
                    }, 300);
                    break;
                case 'requestSearchByUser':
                    $rootScope.$broadcast('log.filterSearchByUser', $scope.data.filter);
                    $timeout(function() {
                        kendo.mobile.application.replace('view-searches-search-by-user.html?id='+$scope.data.userId);
                    }, 300);
                    break;
            }

        };

    }
});
