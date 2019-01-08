app.controller('SendContactDetailsCtrl', function ($scope,$rootScope,messengerService,$timeout,$log) {

    if (!$scope.data) {
        $scope.data={};

        $rootScope.$on('sendContactDetail',function(event,contact){
            $log.debug('sending contact');
            $log.debug(angular.copy(contact));

            $scope.data.contact=null;

            $timeout(function(){
                $scope.data.contact=contact;

                var i;

                if (contact.birthday) {
                    if (isIos()) {
                        var dt=new Date(contact.birthday);
                        var d=dt.getDate();
                        if (d<10) {
                            d='0'+d;
                        }
                        var m=dt.getMonth()+1;
                        if (m<10) {
                            m='0'+m;
                        }

                        contact.birthday=((contact.birthday>0) ? dt.getFullYear():'-')+'-'+m+'-'+d;
                    }
                    $scope.data.sendBirthday = true;
                } else {
                    $scope.data.sendBirthday = false;
                }

                $scope.data.sendPhoneNumbers=[];

                if (angular.isArray(contact.phoneNumbers)) {
                    for (i in contact.phoneNumbers) {
                        $scope.data.sendPhoneNumbers.push(true);
                    }
                }

                if (angular.isArray(contact.emails)) {
                    $scope.data.sendEmails = [];
                    for (i in contact.emails) {
                        $scope.data.sendEmails.push(true);
                    }
                }

                if (angular.isArray(contact.addresses)) {
                    $scope.data.sendAddresses = [];
                    for (i in contact.addresses) {
                        if (!contact.addresses[i].formatted) {
                            contact.addresses[i].formatted=contact.addresses[i].streetAddress;
                        }
                        $scope.data.sendAddresses.push(true);
                    }
                }

                $log.debug(angular.copy(contact));
            });
        });

        $scope.data.onShow = function(kendoEvent) {
        };

        $scope.data.onHide = function(kendoEvent) {
        };

        $scope.data.send=function() {
            var idx;
            var contact={};
            contact.name=angular.copy($scope.data.contact.name);

            if ($scope.data.sendBirthday) {
                contact.birthday = $scope.data.contact.birthday;
            }

            contact.phoneNumbers=[];
            if (angular.isArray($scope.data.contact.phoneNumbers)) {
                for (idx in $scope.data.contact.phoneNumbers) {
                    var phoneNumber=$scope.data.contact.phoneNumbers[idx];
                    if ($scope.data.sendPhoneNumbers[idx]) {
                        contact.phoneNumbers.push(phoneNumber);
                    }
                }
            }

            contact.emails=[];
            if (angular.isArray($scope.data.contact.emails)) {
                for (idx in $scope.data.contact.emails) {
                    var email=$scope.data.contact.emails[idx];
                    if ($scope.data.sendEmails[idx]) {
                        contact.emails.push(email);
                    }
                }
            }

            contact.addresses=[];
            if (angular.isArray($scope.data.contact.addresses)) {
                for (idx in $scope.data.contact.addresses) {
                    var address=$scope.data.contact.addresses[idx];
                    if ($scope.data.sendAddresses[idx]) {
                        contact.addresses.push(address);
                    }
                }
            }

            messengerService.sendMessage2({
                content_type: 'CONTACT',
                extra: angular.toJson({contact:contact})
            });

            kendo.mobile.application.navigate("#:back");
        };
    }


});
