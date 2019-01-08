app.controller('InviteSocialCtrl', function ($scope,status,jsonPostDataPromise) {

    var shareLink=encodeURIComponent(status.refLink);

    if (!$scope.data) {
        $scope.data={
            facebook: 'https://www.facebook.com/sharer/sharer.php?u='+shareLink,
            twitter: 'https://twitter.com/home?status='+shareLink,
            googleplus: 'https://plus.google.com/share?url='+shareLink
        };

        $scope.data.onShow=function(kendoEvent) {
                jsonPostDataPromise('/ext-api-invitation/add-social-invitation');
        };
    }
});
