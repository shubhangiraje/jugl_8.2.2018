app.controller('InviteSmsContactsCtrl', function ($scope,$cordovaContacts,$timeout,$rootScope,modal,$log,gettextCatalog,jsonPostDataPromise) {

    if (!$scope.data) {
        $scope.data={
            listViewOptions: {
                template: $('#template-invite-sms-contacts-item').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    group: 'letter',
                    sort: [
                        {field: "name", dir: "asc" }
                    ]
                }),
                style: 'inset',
                fixedHeaders: false
            }
        };

        $scope.data.contactsSelected=function() {
            var contacts=[];
            for(var i in $scope.data.contacts) {
                if ($scope.data.contacts[i]) {
                    contacts.push($scope.data.listViewOptions.dataSource.get(i));
                }
            }

            if (contacts.length===0) {
                modal.alert(gettextCatalog.getString('Please select contacts'));
            } else {
                $rootScope.selectedContacts = contacts;
                $scope.data.contacts = [];
                kendo.mobile.application.navigate('view-invite-sms-send.html');
            }
        };

        $scope.data.onShow=function(kendoEvent) {
            $scope.data.listViewOptions.dataSource.data([]);

            $timeout(function() {
                kendo.mobile.application.showLoading();

                var options=new ContactFindOptions();
                options.multiple=true;

                $log.debug('InviteSmsContactsCtrl reading contacts');
                $cordovaContacts.find(options)
                    .then(function(contacts) {
                        $log.debug('InviteSmsContactsCtrl contacts readed');
                        $log.debug(contacts);

                        var data=[];

                        for(var i in contacts) {
                            if (contacts[i].name && contacts[i].name.formatted!==null&& contacts[i].name.formatted!=='' && contacts[i].phoneNumbers && contacts[i].phoneNumbers[0]) {
                                var contact={
                                    id: data.length,
                                    name: contacts[i].name.formatted,
                                    phone: contacts[i].phoneNumbers[0].value
                                };

                                contact.letter=contact.name.substr(0,1).toUpperCase();

                                data.push(contact);
                            }

                        }

                        var phones=[];
                        for(var idx in data) {
                            phones.push(data[idx].phone);
                        }

                        jsonPostDataPromise('/ext-api-invitation/get-phones-statuses',{phones:phones}).then(function(phonesInfo){
                            if (!angular.isObject(phonesInfo.phones)) {
                                return;
                            }

                            for(var idx in data) {
                                data[idx].status=phonesInfo.phones[data[idx].phone];
                            }

                            kendo.mobile.application.hideLoading();
                            $scope.data.listViewOptions.dataSource.data(data);
                        },function(){
                            kendo.mobile.application.hideLoading();
                            kendo.mobile.application.navigate('view-invite.html');
                        });
                    },function(error) {
                        kendo.mobile.application.hideLoading();
                        modal.error(gettextCatalog.getString("Can't get phone contacts"));
                        kendo.mobile.application.navigate('view-invite.html');
                        $log.error("InviteSmsContactsCtrl reading contacts failed");
                        $log.error(error);
                    });
            });
        };
    }

    $scope.data.phones={};

});
