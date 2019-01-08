var inviteService=angular.module('InviteService', []);

inviteService.factory('invite',function(gettextCatalog,modal,jsonPostDataPromise,status,$timeout,$rootScope) {
    var factory={};

    factory.invite=function(data,refresh) {
        factory.invitePerson=data;

        if(status.user.packet == 'VIP' || status.user.packet == 'VIP_PLUS') {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('Wenn Du auf \'Einverstanden\' klickst, bist Du verpflichtet, dieses Mitglied zu betreuen, d.h. Kontakt zu ihm aufzunehmen und ihm Jugl.net zu erklären.\n'+
                    'Erkläre ihm Jugl.net daher genau, damit Dein Netzwerk ein aktives Mitglied gewinnt.'),
                buttonArray: [
                    gettextCatalog.getString('Einverstanden'),
                    gettextCatalog.getString('Cancel')
                ]
            }).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-invitation/become-member-invite', {id: data.id})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.winner) {
                            $rootScope.$broadcast('BecomeMemberInviteWinner',data.winner);
                        }
                        $timeout(function(){
                            if (data.message) {
                                modal.alert({message:data.message});
                            }
                            if (data.refresh && refresh) {
                                refresh();
                            }
                        });
						status.update();
                    },function(error) {
                        kendo.mobile.application.hideLoading();
                    });
            });
        } else {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('Diese Funktion ist nur für Premium-Mitglieder.'),
                buttonArray: [
                    gettextCatalog.getString('Jetzt PremiumPlus-Mitglied werden'),
                    gettextCatalog.getString('Ok')
                ]
            }).then(function(result) {
                if (result==1) {
                    kendo.mobile.application.replace('#view-registration-payment.html?isUpgrade=1');
                }
            });
        }


    };

    return factory;
});
