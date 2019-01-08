app.controller('InviteWhatsappCtrl', function ($scope,$rootScope,gettextCatalog,modal,status,$log,jsonPostDataPromise) {

    if (!$scope.data) {
        $scope.data={
            emails: '',
            text: gettextCatalog.getString('Hallo, schau Dir diese neue App an und gib mir bitte ein Feedback. Liebe Grüße\n{link}\n\n\nUnd hier noch das Video dazu:\nhttps://youtu.be/X5h0JSLQP-Y')
        };

        $scope.data.send=function() {
            if ($scope.data.text==='') {
                modal.error(gettextCatalog.getString('Bitte geben Sie den Text ein'));
                return;
            }

            var invLink = config.urls.register+'?refId='+status.user.id;

            var url='whatsapp://send?text='+encodeURIComponent($scope.data.text.replace('{link}',invLink));

            if (isWp()) {
                $rootScope.openUrlInBrowser(url,'_self');
            } else {
                $rootScope.openUrlInBrowser(url);
            }
            kendo.mobile.application.navigate('#:back');
        };

        $scope.data.onShow=function(kendoEvent) {
            jsonPostDataPromise('/ext-api-invitation/add-whatsapp-invitation');
            $scope.data.emails='';
        };
    }

});
