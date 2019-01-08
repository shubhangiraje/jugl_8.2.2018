app.controller('NetworkCtrl', function ($scope,status,jsonDataPromise,$timeout) {

    if (!$scope.data) {
        $scope.data={
            parent: null,
            user: {},
            users: [],
            listViewOptions: {
                template: $('#template-network-item').html(),
                dataSource: new kendo.data.DataSource({
                    data: []
                })
            }
        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $scope.data.onShow=function(kendoEvent) {
            var user_id=kendoEvent.view.params.id ? kendoEvent.view.params.id:status.user.id;

            $scope.data.listViewOptions.dataSource.data([]);
            $scope.data.user={nick_name:''};

            var user_hierarchy_id = kendoEvent.view.params.user_hierarchy_id ? kendoEvent.view.params.user_hierarchy_id : null;

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-network/hierarchy', {user_id:user_id, user_hierarchy_id:user_hierarchy_id})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $scope.data.listViewOptions.dataSource.data(res.users);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };


    }

});
