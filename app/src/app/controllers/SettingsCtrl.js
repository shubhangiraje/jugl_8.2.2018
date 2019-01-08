app.controller('SettingsCtrl', function ($scope,settingsService,status,jsonPostDataPromise) {

    $scope.settings = angular.copy(settingsService.settings);


    $scope.settingsGlobal={
        setting_send_email: true
    };

    $scope.settingsGlobal.setting_notification_likes=status.user.setting_notification_likes;
    $scope.settingsGlobal.setting_notification_comments=status.user.setting_notification_comments;

    if(status.user.setting_off_send_email==1) {
        $scope.settingsGlobal.setting_send_email = false;
    }

    $scope.$watch('settings', function(data, old_data) {
        if (data !== old_data)
            settingsService.save(data);
    }, true);

    $scope.$watch('settingsGlobal', function(data, old_data) {
        if (data !== old_data) {
            jsonPostDataPromise('/ext-api-base/update-settings', {settings:$scope.settingsGlobal}).then(
                function() {
                    status.update();
                }
            );
        }
    }, true);


});
