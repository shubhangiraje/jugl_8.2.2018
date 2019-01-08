app.controller('UserInterestsUpdateCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,modal,$timeout,$cordovaActionSheet,gettextCatalog) {


    if (!$scope.data) {
        $scope.data={
            interest: {},
            interests: [],
            listViewOptions: {
                template: $('#template-user-interests-update').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    sort: [
                        { field: "interest_sort", dir: "asc" }
                    ]
                })
            }
        };

        $scope.data.onShow=function(kendoEvent) {

            var paramss = {
                id: kendoEvent.view.params.id,
                parent: kendoEvent.view.params.parent
            };

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-user-interests/update', paramss)
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $scope.data.listViewOptions.dataSource.data(res.interests);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };



        $scope.data.deleteFromLevel2Interest = function(interestLevel1Id, interestLevel2Id) {

            var params = {
                interestLevel1Id: interestLevel1Id,
                interestLevel2Id: interestLevel2Id
            };

            modal.confirmYesCancel(gettextCatalog.getString('You really want to delete this user from Unterkategorien?')).then(function(result) {
                if (result==1) {
                    $timeout(function(){
                        kendo.mobile.application.showLoading();
                        jsonPostDataPromise('/ext-api-user-interests/delete-level2-interest', params)
                            .then(function (res) {
                                angular.extend($scope.data,res);
                                $scope.data.listViewOptions.dataSource.data(res.interests);
                                kendo.mobile.application.hideLoading();
                            },function(){
                                kendo.mobile.application.hideLoading();
                            });

                    });
                }
            });

        };

        $scope.data.deleteFromLevel3Interest = function(interestLevel1Id, interestLevel2Id, interestLevel3Id) {

            var params = {
                interestLevel1Id: interestLevel1Id,
                interestLevel2Id: interestLevel2Id,
                interestLevel3Id: interestLevel3Id
            };

            modal.confirmYesCancel(gettextCatalog.getString('You really want to delete this user from Themenfilter?')).then(function(result) {
                if (result==1) {
                    $timeout(function(){
                        kendo.mobile.application.showLoading();
                        jsonPostDataPromise('/ext-api-user-interests/delete-level3-interest', params)
                            .then(function (res) {
                                angular.extend($scope.data,res);
                                $scope.data.listViewOptions.dataSource.data(res.interests);
                                kendo.mobile.application.hideLoading();
                            },function(){
                                kendo.mobile.application.hideLoading();
                            });

                    });
                }
            });

        };

        $scope.data.actionLevel2Interests = function(interestLevel1Id, interestLevel2Id) {
            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Aktionen'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Erstellen'),
                    gettextCatalog.getString('Löschen')
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                switch(btnIndex) {
                    case 1:
                        kendo.mobile.application.navigate('view-interests-addstep3.html?type=addInterest&id='+interestLevel2Id);
                        break;
                    case 2:
                        $scope.data.deleteFromLevel2Interest(interestLevel1Id, interestLevel2Id);
                        break;
                }
            });
        };


        $scope.data.actionLevel3Interests = function(interestLevel1Id, interestLevel2Id, interestLevel3Id) {

            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Aktionen'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Löschen'),
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                switch(btnIndex) {
                    case 1:
                        $scope.data.deleteFromLevel3Interest(interestLevel1Id, interestLevel2Id, interestLevel3Id);
                        break;
                }
            });

        };




    }

});
