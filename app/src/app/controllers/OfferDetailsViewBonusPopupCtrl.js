app.controller('OfferDetailsViewBonusPopupCtrl', function ($log,modal,jsonPostDataPromise,$rootScope,$scope,$interval,status,$timeout) {

    if (!$scope.data) {
	
        $scope.data={};

        var intervalPromise = null;

        $rootScope.$on('offerDetailsViewBonusPopup',function(event,data){

            $scope.data.offer_id = data.offer_id;
            $scope.data.view_bonus = data.view_bonus;
            $scope.data.viewBonusCode = data.viewBonusCode;

            $scope.data.secondsLeft = 10;

            $timeout(function() {
                var container = $('#offers-details-view-bonus-popup').closest('.k-animation-container');
                var contentHeight = $('#offers-details-view-bonus-popup .modal-bonus-container').height();
                var padding =  2 * 10;
                var border =  2 * 1;

                if(!isIos()) {
                    container.css({height: contentHeight + padding + border + 'px'});
                } else {
                    container.css({height: contentHeight + 'px'});
                }
            });

            intervalPromise = $interval(function(){
                $scope.data.secondsLeft--;
                if ($scope.data.secondsLeft===0) {
                    $('#offers-details-view-bonus-popup').kendoMobileModalView('close');
                }
            },1000);

        });


        $scope.data.accept = function() {

            var params = {
                offer_id: $scope.data.offer_id,
                code: $scope.data.viewBonusCode
            };

            $log.debug(params);

            $timeout(function(){

                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-offer/accept-view-bonus', params)
                    .then(function (res) {
                        if(res.result) {
                            status.update();
                            $('#offers-details-view-bonus-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                        } else {
                            modal.alert(res.result);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        $scope.data.onClose = function(kendoEvent) {
            $interval.cancel(intervalPromise);
        };



    }


});