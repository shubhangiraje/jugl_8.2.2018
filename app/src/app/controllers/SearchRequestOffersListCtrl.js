app.controller('SearchRequestOffersListCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $rootScope, $timeout, modal, gettextCatalog) {

    if (!$scope.data) {
        $scope.data={
            searchRequest: {}
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.searchRequest = {};
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-search-request-offer/offers-list',{id:kendoEvent.view.params.id})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };


    }
});
