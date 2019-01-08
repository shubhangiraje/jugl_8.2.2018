app.controller('LayoutMainCtrl', function ($scope,status,$timeout) {
    if (!$scope.data) {

        $(window).on('hashchange', function() {
            var tabstrip = kendo.mobile.application.view().footer.find(".km-tabstrip").data("kendoMobileTabStrip");

            if(tabstrip) {
                if(window.location.hash == '#view-contacts.html' ||
                    window.location.hash == '#view-activities.html' ||
                    window.location.hash == '#view-funds.html') {
                    return;
                } else {
                    tabstrip.clear();
                }
            }

        });

        $scope.data={
            tabStripOptions: {
                select: function(e) {
                    if (e.item.attr('id')=='layout-main-drawer') {
                        $timeout(function(){
                            var tabstrip = kendo.mobile.application.view().footer.find(".km-tabstrip").data("kendoMobileTabStrip");
                            tabstrip.clear();
                            tabstrip.switchTo(window.location.hash);
                        });
                        return;
                    }
                }
            }
        };
    }

});
