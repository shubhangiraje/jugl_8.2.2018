app.controller('RegistrationIndexCtrl', function ($scope,$timeout,modal,jsonPostDataPromise) {

    if (!$scope.data) {

        $scope.data = {
            code: ''
        };

        $scope.data.onShow=function(kendoEvent) {
            $scope.data.code = '';
        };

        $scope.data.sendCode = function() {

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-registration/index', {code: {code:$scope.data.code}})
                    .then(function (res) {
                        if (res.result) {
                            kendo.mobile.application.hideLoading();
                            kendo.mobile.application.navigate('view-registration-data.html?code='+$scope.data.code);
                        } else {
                            modal.showErrors(res.error.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }

});



