
app.directive('kendoMobileTabStripBadge', function($log) {
    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {
            element.attr('data-badge', ' ');

            $scope.$watch($attrs.kendoMobileTabStripBadge, function(newValue) {
                var badgeEl=element.find('.km-badge');
                badgeEl.html(newValue);
                if (+newValue>0) {
                    badgeEl.css('display','inline');
                } else {
                    badgeEl.css('display','none');
                }
            });
        }
    };
});
