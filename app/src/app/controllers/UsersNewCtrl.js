app.controller('UsersNewCtrl', function ($scope,jsonDataPromise,$rootScope, $timeout) {

    if (!$scope.data) {

        $scope.data={
            log: {
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false,
				countryArrayNewUser:[]
            },
			user_status:{
				user:{}
			}
        };

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
            $scope.data.log.refresh();
			$scope.labels=$rootScope.status.labels;
				jsonDataPromise('/ext-api-country/get-country-list-new-user')
						.then(function (res) {
							angular.extend($scope.data.log.countryArrayNewUser, res);
							$scope.data.log.newUserCountry = [{id:$rootScope.status.user.country_id}];
				});
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

			$scope.countryIds='';
			angular.forEach($scope.data.log.newUserCountry,function(item,index){
				if($scope.countryIds!==''){
				$scope.countryIds=$scope.countryIds+','+item.id;
				}
				else{
				$scope.countryIds=item.id;
				}
			});

            jsonDataPromise('/ext-api-user-search-new/new-users', {
                pageNum: data.pageNum,country_ids:$scope.countryIds
            })
                .then(function (res) {
                    data.loading=false;

					$scope.user_status={
							user:{}
					};

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

		$scope.$watch('data.log.newUserCountry',function(newValue,oldValue) {
			if (newValue != oldValue) {
			  $scope.data.log.refresh();
			}
		},true);

    }

});
