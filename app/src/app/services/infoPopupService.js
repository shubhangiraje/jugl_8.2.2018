var infoPopupService=angular.module('infoPopupService', []);

infoPopupService.factory('infoPopup',function($rootScope,$timeout,gettextCatalog,$localStorage,jsonDataPromise) {

    var factory={};

    if (!$rootScope.infoPopup) {
        $rootScope.infoPopup={};
    }

    factory.show = function(view) {
        factory.updateViews(view);
        $rootScope.infoPopup.show=false;
        $timeout(function(){
            jsonDataPromise('/ext-api-info/get-view', {view: view})
                .then(function(data) {
                    $rootScope.infoPopupData=data;
                    $rootScope.infoPopup.show=true;
                    $timeout(function(){
                        $('#view-info-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('infoPopupResize');
                        }, 50);
                    });
                });
        });
    };


    factory.updateViews = function(view) {
        if($localStorage.infoViewedViews) {
            if($localStorage.infoViewedViews.indexOf(view)<0) {
                $localStorage.infoViewedViews.push(view);
            }
        } else {
            $localStorage.infoViewedViews = [];
            $localStorage.infoViewedViews.push(view);
        }
    };

    factory.isOneShow = function(view) {
        if($localStorage.infoViewedViews) {
            return $localStorage.infoViewedViews.indexOf(view)<0;
        } else {
            return true;
        }
    };

    factory.getInfoViewNavigate = function(view, user_id) {
        var views = {
            'info-offer-type':'view-offers-search.html',
            'view-contact':'view-contacts.html',
            'view-activities':'view-activities.html',
            'view-deals-completed':'view-deals-completed.html',
            'view-earn-money':'view-earn-money.html',
            'view-favorites':'view-favorites.html',
            'view-forum':'view-trollbox-list.html',
            'view-funds-app':'view-funds.html',
            'view-interests-offer':'view-interests.html?type=OFFER',
            'view-interests-search-request':'view-interests.html?type=SEARCH_REQUEST',
            'view-invite':'view-invite.html',
            'view-invite-log':'view-invite-log.html',
            'view-invite-my-list':'view-invite-my-list.html',
            'view-network':'view-network.html?id='+user_id,
            'view-news':'view-news.html',
            'view-offers-index':'view-offers-index.html',
            'view-offers-add':'view-offers-add.html',
            'view-offers-my':'view-offers-my.html',
            'view-offers-my-requests':'view-offers-my-requests.html',
            'view-offers-search':'view-offers-search.html',
            'view-profile':'view-user-profile-update.html',
            'view-searches-add':'view-searches-add.html',
            'view-searches-index':'view-searches-index.html',
            'view-searches-my':'view-searches-my-list.html',
            'view-searches-my-offers':'view-searches-my-offers.html',
            //'view-searches-offer-add':'view-searches-index.html',
            'view-searches-search':'view-searches-search.html',
            'view-settings':'view-settings.html',
            'view-user-search':'view-user-search.html',
            'view-manage-network':'view-manage-network.html'
        };
        return views[view];
    };


    return factory;

});