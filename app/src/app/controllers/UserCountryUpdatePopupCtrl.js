app.controller('UserCountryUpdatePopupCtrl', function ($scope,$rootScope,jsonPostDataPromise,$timeout) {

    if (!$scope.data) {
        $scope.data = {};

        $rootScope.$on('showUserUpdateCountryPopup',function(event, data) {
            $scope.data.userCountryUpdateForm = data.userData;
            $scope.data.countries = data.countries;
        });

        $scope.data.save = function() {
            jsonPostDataPromise('/ext-api-base/update-country',{user_id:$scope.data.userCountryUpdateForm.user_id, country_id: $scope.data.userCountryUpdateForm.country_id})
                .then(function (data) {
                    if (data.result) {
                        replaceCountryId($rootScope.updateCountryDataObject,$scope.data.userCountryUpdateForm.user_id,$scope.data.userCountryUpdateForm.country_id,data.flag);
                        delete $rootScope.updateCountryDataObject;
                    }
                    $('#view-user-country-update-popup').kendoMobileModalView('close');
                },function(data) {
                });
        };

    }

    function replaceCountryId(dataObj,userId,countryId,flag) {
        var idx;

        if (dataObj instanceof Array) {
            for(idx in dataObj) {
                replaceCountryId(dataObj[idx],userId,countryId,flag);
            }
            return;
        }

        if (typeof dataObj == 'object' && dataObj !== null) {
            if (dataObj.id == userId && dataObj.flag !== '') {
                dataObj.country_id = countryId;
                dataObj.flag = flag;
            }

            for (idx in dataObj) {
                if (dataObj.hasOwnProperty(idx) && typeof dataObj[idx] == 'object') {
                    replaceCountryId(dataObj[idx], userId, countryId, flag);
                }
            }
        }
    }

});