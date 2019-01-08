app.controller('ValidationPhonePopupCtrl', function ($scope,$rootScope,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data={};

        $scope.data.gotoValidationPhone = function() {
            $('#view-validation-phone-popup').kendoMobileModalView('close');
            $rootScope.gotoValidationPhone = true;
            kendo.mobile.application.navigate('view-profile-update.html');
        };

        $scope.data.close = function() {
            jsonPostDataPromise('/ext-api-user-validation-phone-notification/add')
                .then(function (data) {
                    if(data.result) {
                        $('#view-validation-phone-popup').kendoMobileModalView('close');
                    }
                });
        };

    }

});