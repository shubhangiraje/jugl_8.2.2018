app.controller('OfferBetPopupCtrl', function ($scope,$rootScope) {

    if (!$scope.data) {

        $rootScope.$on('OfferBetPopup',function(event,data) {
            $scope.data=data;
        });
    }
});