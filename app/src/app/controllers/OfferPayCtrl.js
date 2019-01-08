app.controller('OfferPayCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $rootScope, $timeout, modal, status) {

    if (!$scope.data) {

        $scope.data={
            offer: {}
        };

        $scope.$watch('data.pay.payment_method',function(newValue){
            if (newValue=='POD') {
                delete $scope.data.pay.delivery_address;
            }
        });

        $scope.$watch('data.pay',function(newValue,oldValue){
            var oldStrVal='';

            function strVal(val) {
                if (!angular.isString(val)) return '';
                return val;
            }

            if (oldValue) {
                oldStrVal=
                    strVal(oldValue.address_street)+
                    strVal(oldValue.address_house_number)+
                    strVal(oldValue.address_zip)+
                    strVal(oldValue.address_city);
            }
            var newStrVal='';
            if (newValue) {
                newStrVal=
                    strVal(newValue.address_street)+
                    strVal(newValue.address_house_number)+
                    strVal(newValue.address_zip)+
                    strVal(newValue.address_city);
            }

            if (oldStrVal==='' && newStrVal!=='') {
                $scope.data.pay.delivery_address='address';
            }
        },true);

        $scope.data.paySave = function () {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-offer/pay-save', {pay: $scope.data.pay}).then(function(data) {
                kendo.mobile.application.hideLoading();
                if (data.result===true) {
                    status.update();
                    kendo.mobile.application.navigate('view-activities.html');
                } else {
                    modal.showErrors(data.pay.$allErrors);
                }
            },function(){
                kendo.mobile.application.hideLoading();
            });
        };

        $scope.data.onShow = function(kendoEvent) {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-offer/pay',{id:kendoEvent.view.params.id})
                    .then(function (res) {
                        kendo.mobile.application.hideLoading();
                        if (res.result===false) {
                            kendo.mobile.application.navigate('view-activities.html');
                            return;
                        }
                        angular.extend($scope.data,res);
                        $scope.data.pay={
                            offer_request_id:$scope.data.offer.request.id
                        };
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

    }
});
