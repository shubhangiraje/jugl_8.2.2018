app.controller('ProfileFillupCtrl', function ($scope, jsonDataPromise, jsonPostDataPromise, $timeout, status, uploadService, modal, $rootScope, dateFilter, $localStorage) {

    if (!$scope.data) {

        $scope.data={

        };

        $scope.data.beforeHide = function(kendoEvent) {
            if (status.user.status=='LOGINED') {
                kendoEvent.preventDefault();
            }

            // if((!status.user.birthday || status.user.birthday==='') && (!status.user.city || status.user.city==='') && (status.user.packet=='VIP' || status.user.packet == 'STANDART')) {
            //     kendoEvent.preventDefault();
            // }
        };

        $scope.data.onShow = function(kendoEvent) {
		 $rootScope.refreshFlag = true;   	
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-profile/index')
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
                kendoEvent.view.scroller.scrollTo(0, 0);
                $rootScope.showStartPopup();
            },0);

        };

        $scope.data.uploadImage = function() {
            uploadService.run(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE)
                .then(
                    function(file) {
                        $scope.data.user.avatarFile.thumbs.avatarMobile = file.thumbs.avatarMobile;
                        $scope.data.user.avatar_file_id = file.id;
                    },
                    function(error) {
                    }
                );
        };


        $scope.data.save = function() {
            var userData = angular.copy($scope.data.user);

            if((status.user.status=='LOGINED' && status.user.packet=='VIP') || (status.user.status=='ACTIVE' && (status.user.packet=='VIP_PLUS' || status.user.packet=='VIP' || status.user.packet=='STANDART'))) {
                if(userData.birthday) {
                    userData.birthDay = dateFilter(userData.birthday,'dd');
                    userData.birthMonth = dateFilter(userData.birthday,'MM');
                    userData.birthYear = dateFilter(userData.birthday,'yyyy');
                }
                userData.saveProfileFillup2 = true;
            }

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-profile/save-profile-fillup', {user: userData})
                    .then(function (res) {
                        if (res.result) {
                            kendo.mobile.application.hideLoading();
                            if (status.user.status==='ACTIVE') {
                                kendo.mobile.application.navigate('#view-dashboard');
                            }
                            status.update();
                        } else {
                            modal.showErrors(res.user.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }

                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        $scope.data.later = function() {
        $rootScope.refreshFlag = true;   
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-profile/later-profile-fillup')
                    .then(function (res) {
							kendo.mobile.application.hideLoading();
                            kendo.mobile.application.navigate('#view-dashboard');     	
							status.update();
					},function(){
							kendo.mobile.application.hideLoading();
					});
			
            
        };


    }

});