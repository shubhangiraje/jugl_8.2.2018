app.controller('InviteFriendsPopupCtrl', function ($scope, $rootScope, jsonPostDataPromise, $interval, $timeout, serverTime) {

    if (!$scope.data) {

        $scope.data = {
            timeLeft: 0
        };

        $rootScope.$on('inviteFriendsPopup',function(event, data){
            $scope.data.timeLeft = data;
        });

    }


});