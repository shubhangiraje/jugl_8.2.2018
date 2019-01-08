app.controller('SpamReportPopupCtrl', function (modal,jsonPostDataPromise,$rootScope,$scope,$timeout) {

    if (!$scope.data) {

        $scope.data={};

        $rootScope.$on('spamReportPopup',function(event,data){
            $scope.data.okCallback=data.okCallback;
            delete data.okCallback;

            $scope.data.spamReport=data;
        });

        $scope.data.save = function() {

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-spam-report/save',{spamReport:$scope.data.spamReport})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result) {
                            $rootScope.$broadcast('spamReported');
                            $('#view-spam-report-popup').kendoMobileModalView("close");
                            if ($scope.data.okCallback) {
                                $scope.data.okCallback();
                            }
                        } else {
                            modal.showErrors(data.spamReport.$allErrors);
                        }
                    },function(data) {
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }


});