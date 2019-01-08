app.controller('RegistrationPaymentCtrl', function ($scope, $rootScope, jsonDataPromise, jsonPostDataPromise, $timeout, status, modal, gettextCatalog, $log, $pixel) {

    if (!$scope.data) {

        $scope.data={

        };

        $scope.data.InAppBuy=function(productId) {
            //productId='com.kreado.jugl.'+productId;
            console.log('P1 '+productId);
            inAppPurchase.getProducts([productId]).then(function(products) {
                console.log('P2');
                console.log(products);
                inAppPurchase.buy(productId).then(
                    function(data) {
                        console.log(data);
                    },
                    function(error) {
                        console.log(error);
                    });
            },function(error){
                console.log(error);
            });
        };

        $scope.data.selectVIP = function() {
            $scope.data.packet='VIP';
            if (!$scope.data.registeredByCode) {
                $scope.data.paymentMethod=1;
            } else {
                $scope.data.saveVIP();
            }
        };

        $scope.data.selectVIPPlus = function() {
            $scope.data.InAppBuy('VIP_PLUS');
            return;
            $scope.data.packet='VIP_PLUS';
            $scope.data.paymentMethod=1;
        };

        $scope.data.saveSTD = function () {
            modal.confirmOkCancel({
                message: gettextCatalog.getString('Möchtest Du wirklich nur das Standard-Paket wählen? Dadurch verzichtest Du auf viele Vorteile des Premium-Pakets wie z.B. höhere Provisionen und geringere Abgaben. Bitte beachte, das eine nachträgliche Änderung des gewählten Pakets möglich ist, jedoch nicht mehr zu diesem Preis.'),
                title: gettextCatalog.getString('Paket wählen')
            }).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    jsonPostDataPromise('/ext-api-registration-payment/save-std').then(function() {
					    status.update();
                        $pixel.purchase({
                            content_name: 'STANDARD',
                            value: '0',
                            currency: 'EUR'
                        });
                        kendo.mobile.application.replace('view-dashboard.html');
                    });
                } else {
                }
            });
        };

        $scope.data.paymentFinished=function(finishUrl) {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-registration-payment/payment-status', {id: $scope.data.paymentId}).then(
                function(data) {
                    kendo.mobile.application.hideLoading();

                    if (!data.result || !data.payInRequest) {
                        modal.alert({message:gettextCatalog.getString('Payment error, please try again')});
                        return;
                    }

                    if (data.payInRequest.confirm_status=='SUCCESS') {
                        status.update();
                        modal.alert({message:gettextCatalog.getString('Payment processed successfully')});
                        return;
                    }

                    if (data.payInRequest.confirm_status!='SUCCESS') {
                        modal.alert({message:gettextCatalog.getString('Payment failed, please try another payment method')});
                        return;
                    }
                },
                function() {
                    kendo.mobile.application.hideLoading();
                }
            );
        };

        $scope.data.saveVIP = function () {
            if ($scope.data.packet=='VIP') {
                $scope.data.VIP.saving = true;
                jsonPostDataPromise('/ext-api-registration-payment/save-vip', {VIP: $scope.data.VIP}).then(
                    function(data) {
                        $scope.data.VIP.saving = false;
                        if (data.VIP.$allErrors && data.VIP.$allErrors.length>0) {
                            modal.showErrors(data.VIP.$allErrors);
                        } else {

                            $pixel.purchase({
                                content_name: 'VIP',
                                value: $scope.data.VIPPrice,
                                currency: 'EUR'
                            });

                            if ($scope.data.registeredByCode) {
                                status.user.packet = 'VIP';
                                kendo.mobile.application.navigate('#view-dashboard');
                            } else {
                                if (!data.VIP.message) {
                                    var url=config.urls.appMembershipPayment+data.VIP.id;
                                    $scope.data.paymentId=data.VIP.id;
                                    $log.info('opening payment url '+url);
                                    $scope.openUrlInBrowser(url,'_blank',$scope.data.paymentFinished);
                                    /// $state.go('.data', {requestId: data.VIP.id});
                                } else {
                                    $rootScope.PaymentDataMessagePopupText=data.VIP.message;
                                    $('#payment-data-message-popup').kendoMobileModalView('open');
                                    //kendo.mobile.application.navigate('#view-dashboard');
                                }
                            }
                        }
                    },
                    function() {
                        $scope.data.VIP.saving = false;
                    }
                );
            }

            if ($scope.data.packet=='VIP_PLUS') {
                $scope.data.VIP.saving = true;
                jsonPostDataPromise('/ext-api-registration-payment/save-vip-plus', {VIP: $scope.data.VIP}).then(
                    function(data) {
                        $scope.data.VIP.saving = false;
                        if (data.VIP.$allErrors && data.VIP.$allErrors.length>0) {
                            modal.showErrors(data.VIP.$allErrors);
                        } else {

                            $pixel.purchase({
                                content_name: 'VIP_PLUS',
                                value: $scope.data.VIPPlusPrice,
                                currency: 'EUR'
                            });

                            if (!data.VIP.message) {
                                var url=config.urls.appMembershipPayment+data.VIP.id;
                                $scope.data.paymentId=data.VIP.id;
                                $log.info('opening payment url '+url);
                                $scope.openUrlInBrowser(url,'_blank',$scope.data.paymentFinished);
                                /// $state.go('.data', {requestId: data.VIP.id});
                            } else {
                                $rootScope.PaymentDataMessagePopupText=data.VIP.message;
                                $('#payment-data-message-popup').kendoMobileModalView('open');
                                //kendo.mobile.application.navigate('#view-dashboard');
                            }
                        }
                    },
                    function() {
                        $scope.data.VIP.saving = false;
                    }
                );
            }
        };

        /*$scope.data.beforeHide = function(kendoEvent) {
            if (status.user.packet==='' && !data.user.not_force_packet_selection) {
                kendoEvent.preventDefault();
            }
        };*/

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.VIP={packet:1};

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-registration-payment/index')
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
                kendoEvent.view.scroller.scrollTo(0, 0);
            },0);

            $scope.data.isUpgrade=kendoEvent.view.params.isUpgrade;

        };



    }

});