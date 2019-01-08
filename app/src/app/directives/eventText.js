app.directive('eventText', function($compile,gettextCatalog,status) {
    return {
        restrict: 'A',
        link: function(scope, element, $attrs) {
            var text=scope.$eval($attrs.eventText);

            //text=text.replace(/\[([a-zA-Z]+(:\d+)+|\/[a-zA-Z]+)\]/g,'');

            text=text.replace(/\[([a-zA-Z]+(:[-0-9a-zA-Z]+)*|\/[a-zA-Z]+)\]/g,function(value) {
                if (value.match(/\[\/[a-zA-Z]+\]/)) {
                    return '</a>';
                }

                var parts=value.match(/\[([a-zA-Z]+)(:[-0-9a-zA-Z]+)?(:[-0-9a-zA-Z]+)?(:[-0-9a-zA-Z]+)?\]/);
                if (parts) {

                    switch (parts[1]) {
                        case 'groupChat':
                            return '<a href="" ng-click="data.enterGroupChat('+parts[2].replace(':','')+')">';
                        case 'upgradePacket':
                            return '<kendo-mobile-button ng-if="status.user.packet==\'VIP\'"  k-on-click="navigate(\'view-registration-payment.html?isUpgrade=1\')">'+gettextCatalog.getString('Jetzt PremiumPlus Midglied werden')+'</kendo-mobile-button>' +
                                '<kendo-mobile-button ng-if="status.user.packet==\'STANDART\'"  k-on-click="navigate(\'view-registration-payment.html?isUpgrade=1\')">'+gettextCatalog.getString('Jetzt Premium/PremiumPlus Midglied werden')+'</kendo-mobile-button>';
                        case 'networkMoveAccept':
                            return '<kendo-mobile-button k-on-click="data.networkAcceptMoving('+parts[2].replace(':','')+','+parts[3].replace(':','')+','+parts[4].replace(':','')+')">'+gettextCatalog.getString('Ja')+'</kendo-mobile-button>';
                        case 'networkMoveReject':
                            return '<kendo-mobile-button k-on-click="data.networkRejectMoving('+parts[2].replace(':','')+','+parts[3].replace(':','')+','+parts[4].replace(':','')+')">'+gettextCatalog.getString('Nein')+'</kendo-mobile-button>';
                        case 'stickParentAccept':
                            return '<kendo-mobile-button k-on-click="data.stickParentAccept()">'+gettextCatalog.getString('Zustimmen')+'</kendo-mobile-button>';
                        case 'stickParentReject':
                            return '<kendo-mobile-button k-on-click="data.stickParentReject()">'+gettextCatalog.getString('Ablehnen')+'</kendo-mobile-button>';
                        case 'spamReportDeactivate':
                            return '<kendo-mobile-button k-on-click="data.spamReportDeactivate(event.id,'+parts[2].replace(':','')+')">'+gettextCatalog.getString('Spammeldung zurücknehmen')+'</kendo-mobile-button>';
                        case 'toggleBlockParentTeamRequests':
                            return '<kendo-mobile-button k-on-click="data.toggleBlockParentTeamRequests()"><span ng-if="!status.user.block_parent_team_requests">'+gettextCatalog.getString('Teamanfragen stoppen')+'</span><span ng-if="status.user.block_parent_team_requests">'+gettextCatalog.getString('Teamanfragen erlauben')+'</span></kendo-mobile-button>';
                        case 'teamChangeUserSearch':
                            return '<a href="" ng-click="navigate(\'view-team-change-user-search.html\')">';
                        case 'offer':
                            return '<a href="" ng-click="navigate(\'view-offers-details.html?id='+parts[2].replace(':','')+'\')">';
                        case 'searchRequestOfferFeedback':
                            return '<kendo-mobile-button data-rel="modalview" data-search-request-offer-id="'+parts[2].replace(':','')+'" href="#deals-completed-update-user-feedback-popup">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'searchRequestOfferCounterFeedback':
                            return '<kendo-mobile-button data-rel="modalview" data-search-request-offer-id="'+parts[2].replace(':','')+'" href="#deals-completed-update-counter-user-feedback-popup">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'offerRequestFeedback':
                            return '<kendo-mobile-button data-rel="modalview" data-offer-request-id="'+parts[2].replace(':','')+'" href="#deals-completed-update-user-feedback-popup">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'offerRequestCounterFeedback':
                            return '<kendo-mobile-button data-rel="modalview" data-offer-request-id="'+parts[2].replace(':','')+'" href="#deals-completed-update-counter-user-feedback-popup">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'vipProlongation':
                            return '<kendo-mobile-button ng-if="status.user.vipProlongActive" k-on-click="navigate(\'#view-registration-payment.html?isUpgrade=1\')">'+gettextCatalog.getString('Mitgliedschaft jetzt verlängern')+'</kendo-mobile-button>';
                        case 'vipUpgrade':
                            return '<kendo-mobile-button ng-if="status.user.packet!=\'VIP\'" k-on-click="navigate(\'#view-registration-payment.html?isUpgrade=1\')">'+gettextCatalog.getString('Erneut erwerben')+'</kendo-mobile-button>';
                        case 'teamleaderFeedback':
                            return '<kendo-mobile-button k-on-click="navigate(\'view-user-profile.html?scroll-to-teamleader=1&id=\'+status.user.id)">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'teamFeedbacks':
                            return '<kendo-mobile-button k-on-click="navigate(\'view-user-profile.html?scroll-to-teamleader-feedbacks=1&id=\'+status.user.id)">'+gettextCatalog.getString('Bewerten')+'</kendo-mobile-button>';
                        case 'searchRequestOffer':
                            return '<a href="" ng-click="navigate(\'view-searches-offer-details.html?id='+parts[3].replace(':','')+'\')">';
                        case 'searchRequest':
                            return '<a href="" ng-click="navigate(\'view-searches-details.html?id='+parts[2].replace(':','')+'\')">';
                        case 'offerPay':
                            return '<kendo-mobile-button href="view-offer-pay.html?id='+parts[3].replace(':','')+'">'+gettextCatalog.getString('Jetzt Bezahlen')+'</kendo-mobile-button>';
                        case 'offerPayConfirm':
                            return '<kendo-mobile-button k-on-click="data.offerRequestPayConfirm('+parts[3].replace(':','')+')">'+gettextCatalog.getString('Geldeingang bestätigen')+'</kendo-mobile-button>';
                        case 'offerPayNotifyBuyer':
                            return '<kendo-mobile-button k-on-click="data.offerRequestPayNotifyBuyer('+parts[3].replace(':','')+')">'+gettextCatalog.getString('Abmahnen')+'</kendo-mobile-button>';
                        case 'myOfferRequest':
                            return '<a href="" ng-click="data.goMyOfferRequest({id:'+parts[2].replace(':','')+'})">';
                        case 'userProfile':
                            return '<a href="" ng-click="navigate(\'view-user-profile.html?id='+parts[2].replace(':','')+'\')">';
                        case 'myOffer':
                            return '<a href="" ng-click="data.goMyOffer({id:'+parts[2].replace(':','')+'})">';
                        case 'jugl':
                            return '<i class="icon-jugl-light"></i>';
                        case 'nobrStart':
                            return '<nobr>';
                        case 'nobrEnd':
                            return '</nobr>';
                        case 'br':
                            return '<br/>';
                        case 'userTeamRequestAccept':
                            return '<kendo-mobile-button k-on-click="data.userTeamRequestAccept('+parts[2].replace(':','')+')">'+gettextCatalog.getString('Annehmen')+'</kendo-mobile-button>';
                        case 'userTeamRequestDecline':
                            return '<kendo-mobile-button k-on-click="data.userTeamRequestDecline('+parts[2].replace(':','')+')">'+gettextCatalog.getString('Ablehnen')+'</kendo-mobile-button>';
                        case 'info':
                            return '<a href="" ng-click="data.goInfoView('+"'"+parts[2].replace(":","")+"'"+')">';
                    }
                }
                return '';

            });

            text=text.replace(/(<kendo-mobile-button)/,'<div class="clearfix" style="margin-bottom: 5px"></div>$1');

            var el = $compile('<div>'+text+'</div>')( scope );

            // stupid way of emptying the element
            element.html("");

            // add the template content
            element.append( el );
        }
    };
});
