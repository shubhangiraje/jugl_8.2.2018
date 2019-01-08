app.controller('SelectContactCtrl', function ($scope,userNameFilter,$timeout,messengerService,gettextCatalog,$rootScope,$cordovaDialogs, modal) {

    var self=this;

    function updateContactsData() {
        var data = [];

        for (var i in messengerService.users) {
            var user = messengerService.users[i];
            var userData = {
                id: user.id,
                dt: $scope.lastMessages[user.id] ? $scope.lastMessages[user.id].dt:'',
                userName: user.first_name + ' ' + user.last_name
            };

            userData.letter = user.first_name.substr(0, 1).toUpperCase();

            data.push(userData);
        }

        $scope.data.listViewOptions.dataSource.data(data);
    }

    if (!$scope.data) {
        $scope.selectContact=function(user) {
            modal.confirmOkCancel({
                message: gettextCatalog.getString('Wirklich weiterleiten?'),
                title: gettextCatalog.getString('Nachricht weiterleiten')
        }).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    $rootScope.$broadcast('contactSelected',user);
                }
            });
        };

        $scope.data={
            grouped: false,
            listViewOptions: {
                template: $('#template-select-contact-item').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    sort: [
                        {field: "dt", dir: "desc" },
                        {field: "userName", dir: "asc" }
                    ],
                    group: []
                }),
                filterable: {
                    field: "userName",
                    operator: "contains",
                    placeholder: "Suche...",
                    ignoreCase: true
                },
                fixedHeaders: true
            }
        };

        $scope.data.onShow=function(event) {
            updateContactsData();
        };

        $scope.data.toggleGrouped=function() {
            $scope.data.grouped=!$scope.data.grouped;
            if ($scope.data.grouped) {
                $scope.data.listViewOptions.dataSource.group([{field:'letter'}]);
            } else {
                $scope.data.listViewOptions.dataSource.group([]);
                $('#view-select-contact .km-scroll-header').html('');
            }
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
        };
    }
});
