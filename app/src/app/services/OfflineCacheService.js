var offlineCacheService=angular.module('OfflineCacheService', []);

offlineCacheService.factory('offlineCacheService',function($localStorage,$filter,$log) {
    var keyPrefix = 'messengerCache_';

    var factory={
    };

    factory.setUsers=function(users) {
        $localStorage[keyPrefix + 'users'] = users;
    };

    factory.getUsers=function() {
        return $localStorage[keyPrefix + 'users'];
    };

    factory.setUser=function(user) {
        $localStorage[keyPrefix + 'user'] = user;
    };

    factory.getUser=function() {
        return $localStorage[keyPrefix + 'user'];
    };

    factory.setDecisionNeededIds=function(val) {
        $localStorage[keyPrefix + 'decision_needed_ids'] = val;
    };

    factory.getDecisionNeededIds=function() {
        return $localStorage[keyPrefix + 'decision_needed_ids'];
    };

    factory.setFriendsIds=function(val) {
        $localStorage[keyPrefix + 'friends_ids'] = val;
    };

    factory.getFriendsIds=function() {
        return $localStorage[keyPrefix + 'friends_ids'];
    };

    factory.setIgnoredIds=function(val) {
        $localStorage[keyPrefix + 'ignored_ids'] = val;
    };

    factory.getIgnoredIds=function() {
        return $localStorage[keyPrefix + 'ignored_ids'];
    };

    factory.setStatus=function(status) {
        $localStorage[keyPrefix + 'status'] = status;
    };

    factory.getStatus=function() {
        return $localStorage[keyPrefix + 'status'];
    };

    factory.setConversations=function(conversations) {
        var oldConversations=factory.getConversations();

        if (oldConversations) {
            // delete removed conversations data
            var userIds={};
            var i;
            for(i in oldConversations) {
                if (oldConversations[i]) {
                    userIds[oldConversations[i].user_id] = true;
                }
            }
            for(i in conversations) {
                if (conversations[i].user_id) {
                    delete userIds[conversations[i].user_id];
                }
            }
            for(i in userIds) {
                factory.removeConversationsData(i);
            }
        }

        $localStorage[keyPrefix + 'conversations'] = conversations;
    };

    factory.getConversations=function() {
        return $localStorage[keyPrefix + 'conversations'];
    };

    factory.setConversationData=function(conversationData) {
        var data=angular.copy(conversationData);
        data.log=$filter('orderBy')(data.log,'dt');
        data.log=data.log.filter(function(message){
            return message.type!='OUTGOING_SENDING';
        });
        data.log.splice(0,data.log.length-50);

        for(var i in data.log) {
            delete data.log[i].downloading;
            delete data.log[i].sending;
            delete data.log[i].uploading;
            delete data.log[i].fileEntry;
        }

        $localStorage[keyPrefix + 'conversation_' + conversationData.user_id] = data;
    };

    factory.getConversationData=function(userId) {
        var data=$localStorage[keyPrefix + 'conversation_'+userId];
        if (data) {
            for (var i in data.log) {
                data.log[i].fromCache = true;
            }
        }

        return data;
    };

    factory.removeConversationsData=function(userId) {
        delete $localStorage[keyPrefix + 'conversation_'+userId];
    };

    factory.clear=function() {
        factory.setConversations([]);
        factory.setUsers(null);
        factory.setUser(null);
        factory.setStatus(null);
    };

    return factory;
});
