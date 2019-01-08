app.controller('UserInterestsCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,$cordovaActionSheet,modal,$timeout,gettextCatalog,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            interests: [],
            interestsChecks: {}
        };


        $scope.data.onShow=function(kendoEvent) {
            $scope.data.type=kendoEvent.view.params.type;

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-interests/list',{type:$scope.data.type})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };


        $scope.data.save = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-user-interests/save', {interestsChecks: $scope.data.interestsChecks, type:$scope.data.type})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        modal.alert(gettextCatalog.getString('Du hast erfolgreich neue Interessen hinzugefügt.')).then(function() {
                            if($scope.data.type!='OFFER') {
                                $rootScope.refreshFlag=true;
                                kendo.mobile.application.replace('view-searches-search.html');
                            } else {
                                $rootScope.refreshFlag=true;
                                kendo.mobile.application.replace('view-offers-search.html');
                            }
                        });
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });
        };


    }

});
