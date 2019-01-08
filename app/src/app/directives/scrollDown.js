app.directive('scrollDown', function($timeout,$rootScope,$log) {
    var addedScrollThisTime=false;

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
                if (!$scope.$eval($attrs.scrollDown)) {
                    return;
                }

                if (!addedScrollThisTime) {
                    addedScrollThisTime=true;
                    $timeout(function(){
                        $rootScope.$broadcast('chat.scroller.scroll', true);
                        addedScrollThisTime=false;
                    });
                }
        }
    };
});
