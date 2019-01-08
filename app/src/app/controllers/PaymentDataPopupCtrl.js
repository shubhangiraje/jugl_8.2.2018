app.controller('PaymentDataPopupCtrl', function ($scope, $rootScope, $timeout) {

    if (!$scope.data) {
        $scope.data={};

        $scope.data.close=function() {
            kendo.mobile.application.navigate('#view-dashboard');
        };
    }

    $scope.data.message=$rootScope.PaymentDataMessagePopupText;


    $timeout(function() {
        var container = $('#payment-data-message-popup').closest('.k-animation-container');
        var contentHeight = $('#payment-data-message-popup-contents').height();
        var padding = 2 * 10;
        var border = 2 * 1;
        container.css({height: contentHeight + padding + border + 'px'});
    });
});