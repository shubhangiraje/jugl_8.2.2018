app.controller('RegistrationDataOldCtrl', function ($scope,$timeout,modal,jsonPostDataPromise,auth,status) {

    if (!$scope.data) {

        $scope.data = {
            user : {
                email: '',
                password: '',
                code: ''
            }
        };

        $scope.data.onShow=function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
            $scope.data.user.email = '';
            $scope.data.user.password = '';
            $scope.data.user.code = '';
        };

        $scope.data.save = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-registration/data', {user: $scope.data.user})
                    .then(function (res) {
                        if (res.result) {
                            auth.login($scope.data.user.email,$scope.data.user.password).then(function(result){
                                kendo.mobile.application.hideLoading();
                                if (result===true) {
                                    status.user.status='ACTIVE';
                                    kendo.mobile.application.replace('#view-profile-fillup');
                                } else {
                                    modal.error(result);
                                }
                            });
                        } else {
                            modal.showErrors(res.user.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }

});



