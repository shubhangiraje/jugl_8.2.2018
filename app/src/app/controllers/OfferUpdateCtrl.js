app.controller('OfferUpdateCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            id: {},
            offerUpdateForm: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.id = kendoEvent.target.attr('data-id');
            $scope.data.offerUpdateForm = {};

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-offer/update', {id: $scope.data.id})
                    .then(function (res) {
                        angular.extend($scope.data,res);

                        $timeout(function() {
                            $('#view-offers-update-popup').data("kendoMobileModalView").scroller.scrollTo(0, 0);
                            var container = $('#view-offers-update-popup').closest('.k-animation-container');
                            var contentHeight = $('#view-offers-update-popup .offer-update-box').height();
                            var padding = 2 * 10;
                            var border = 2 * 1;
                            container.css({height: contentHeight + padding + border + 'px'});
                        });

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.save = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-offer/update-save', {offerUpdateForm: $scope.data.offerUpdateForm})
                    .then(function (res) {
                        if(res.result) {
                            $('#view-offers-update-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();

                            $rootScope.$broadcast('offerUpdate', res.offer);
                        } else {
                            modal.showErrors(res.offerUpdateForm.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });
        };
    }

});