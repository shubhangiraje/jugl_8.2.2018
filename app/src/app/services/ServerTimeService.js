var serverTimeService=angular.module('ServerTimeService', []);

serverTimeService.factory('serverTime',function() {
    var factory={};

    factory.currentDelta=0;

    factory.setCurrentServerTime=function(date) {
        var ourNow = new Date();
        var serverNow = new Date(date);
        factory.currentDelta=serverNow.getTime()-ourNow.getTime();
    };

    factory.getCurrentServerTime=function() {
        return (new Date()).getTime()+factory.currentDelta;
    };

    return factory;
});
