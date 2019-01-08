app.controller('OfferAdvancedSearchCtrl', function ($scope,jsonDataPromise,$timeout,$localStorage,$rootScope,$cordovaGeolocation,$cordovaSpinnerDialog,gettextCatalog,modal,$log) {
    /*jshint -W069 */

    if (!$scope.data) {

        $scope.data = {
            filter: {},
            interests: {}
        };

        $scope.data.search=function() {
            $rootScope.refreshFlag=true;

            if ($scope.data.filter.advancedEnabled && $scope.data.filter.advanced.distance) {
                $cordovaGeolocation.getCurrentPosition({
                    timeout: 60*1000,
                    maximumAge: 60*1000,
                    enableHighAccuracy: false
                }).then(function(position) {
                    $log.debug("got geolocation");
                    $log.debug(position);

                    $scope.data.filter.advanced.lattitude=position.coords.latitude;
                    $scope.data.filter.advanced.longitude=position.coords.longitude;

                    $timeout(function(){
                        kendo.mobile.application.navigate('view-offers-advanced-search-results.html');
                    });

                    $cordovaSpinnerDialog.hide();
                },function(err) {
                    $cordovaSpinnerDialog.hide();
                    modal.error(gettextCatalog.getString("Can't retrieve geolocation:"+' '+err.message));
                    $log.error("Can't retrieve geolocation");
                    $log.error(err);
                });

                $cordovaSpinnerDialog.show(gettextCatalog.getString('Inserate durchsuchen'),gettextCatalog.getString('Retrieving geolocation'),true);

            } else {
                kendo.mobile.application.navigate('view-offers-advanced-search-results.html');
            }
        };

        $scope.data.onShow=function(kendoEvent) {

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-offer-advanced-search/index')
                    .then(function (res) {
                        angular.extend($scope.data,res.results);
                        $scope.data.interestsChecks={};
                        for(var idx in $scope.data.interests) {
                            var id=$scope.data.interests[idx].interest_id;

                            if (!$scope.data.filter.excludeInterests || $scope.data.filter.excludeInterests.indexOf(id)<0) {
                                $scope.data.interestsChecks[id]=true;
                            }
                        }

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };

        $scope.$watch('data.filter',function(newVal,oldVal) {
            $localStorage['offersAdvancedSearchFilter']=newVal;
        },true);

        $scope.$watch('data.interestsChecks',function(newVal,oldVal) {
            if (newVal==oldVal) return;

            $scope.data.filter.excludeInterests=[];
            for(var idx in $scope.data.interests) {
                var id=$scope.data.interests[idx].interest_id;
                if (!$scope.data.interestsChecks[id]) {
                    $scope.data.filter.excludeInterests.push(id);
                }
            }
        },true);
    }

    var filter=$localStorage['offersAdvancedSearchFilter'];

    if (!filter) {
        filter={advanced:{}};
    }

    $scope.data.filter=filter;
    /*jshint +W069 */

});



