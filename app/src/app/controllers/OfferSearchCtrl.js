app.controller('OfferSearchCtrl', function ($scope,jsonDataPromise,$rootScope,infoPopup,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {
		
		
		
        $scope.filter = {};

        $scope.data={
            log: {		
				countryArrayOfferSearch:[{}],//nviimedia
                filter:{
					country:[]	//nviimedia
				},
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };


        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
               
				$scope.data.log.refresh();

				/*nviimedia*/
				if($scope.data.log.filter.country.length===0){
					//get information from Extapi only from the user country 
					if($rootScope.status.user.country_id){
						jsonDataPromise('/ext-api-country/get-country-list-offers',{ids:$rootScope.status.user.country_id})
							.then(function (country_count) {
							if(country_count){
								$scope.data.log.filter.country = [{id:$rootScope.status.user.country_id,name:country_count[0].name,flag:country_count[0].flag}];	
							}
						});
					}
	
				}
				/*nviimedia*/
				
                $rootScope.refreshFlag=false;
            }

            if(kendoEvent.view.params.filter) {
                $scope.data.log.filter.type = kendoEvent.view.params.filter;
            }

        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $rootScope.$on('log.filterOffer', function(event, data) {
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

			
            jsonDataPromise('/ext-api-offer-search-ad-new/search', {
                filter: data.filter,
                pageNum: data.pageNum
            })
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
            $rootScope.$broadcast('log.filterOfferClean', 'offerSearch');
        };
		
		this.setAdvertising = function (id, user_bonus, click_interval,ad_link, popup_interval) {
			var advertisements = {};
			advertisements.id = id;
			advertisements.user_bonus = user_bonus;
			advertisements.click_interval = click_interval;
			advertisements.popup_interval = parseInt(popup_interval);
			jsonDataPromise('/ext-api-advertising/set-advertising-user', { advertising_id: id, advertising_click_interval: click_interval })
				.then(function (data) {
					if (user_bonus > 0 && data.result === true) {			
							$timeout(function(){
								$('#advertising-view-bonus-popup').kendoMobileModalView('open');
								$timeout(function() {
									var ref = cordova.InAppBrowser.open(ad_link, '_blank', 'location=yes');
									$rootScope.$broadcast('advertisingViewBonusPopup',advertisements, ref);
								});
							},1000);
					}else{
						cordova.InAppBrowser.open(ad_link, '_blank', 'location=yes');
					}

				});
		};


    }

});
