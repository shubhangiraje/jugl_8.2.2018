app.controller('LoginCtrl', function ($scope,jsonPostDataPromise,jsonDataPromise,auth,modal,$timeout,$localStorage, messengerService,$rootScope,status) {
    $scope.loginForm={};

    $scope.data={};
	
	
    

    this.onShow=function(kendoEvent) {
		
		$scope.data.disableFBLogin=false;
        // jsonPostDataPromise('/ext-api-base/is-device-used-for-registration').then(function (res) {
        //     if (res.error) {
        //         $scope.data.registerError=res.error;
        //     }
        // });
    };

    // force reconnect
    messengerService.logout();

    // this.register=function() {
    //     if ($scope.data.registerError) {
    //         modal.alert({message:$scope.data.registerError});
    //     } else {
    //         kendo.mobile.application.navigate('view-registration-data.html');
    //     }
    // };


    this.login=function() {
        kendo.mobile.application.showLoading();
        auth.login($scope.loginForm.username,$scope.loginForm.password).then(function(result){
            kendo.mobile.application.hideLoading();
            if (result===true) {
                // fix for showing popup
				$rootScope.refreshFlag=true;
                status.user.status='ACTIVE';
                $localStorage.showProfileFillup = false;
                $rootScope.refreshFlag = true;
                kendo.mobile.application.replace('#view-dashboard');
            } else {
                modal.error(result);
            }
        });
    };
	this.loginWithFacebook=function(){		
	kendo.mobile.application.showLoading();
	$scope.data.disableFBLogin=true;
	var permissions=['email','public_profile','user_location','user_birthday'];
		facebookConnectPlugin.login(permissions,
			function successLogin(userData){
				facebookConnectPlugin.getAccessToken(function(access_token) {
					facebookConnectPlugin.api("/me?fields=id,first_name,last_name,email,gender,birthday,location",permissions, function(response) {

						var birth_dates = '';
						var birth_day = '';
						var birth_month = '';
						var birth_year = '';

						if(response.birthday){
							birth_dates=response.birthday.split("/");
							birth_day = birth_dates[1];
							birth_month =birth_dates[0];
							birth_year = birth_dates[2];
						}

						var sex = '';
						if(response.gender){
							sex = response.gender==="male" ? 'M' : 'F';
						}

						var facebookUser = {
							first_name:response.first_name ? response.first_name : '',
							last_name:response.last_name ? response.last_name : '',
							email:response.email ? response.email : '',
							sex: sex,
							city:response.location ? response.location : '',
							birth_day: birth_day,
							birth_month: birth_month,
							birth_year: birth_year
						};

						auth.loginFacebook(access_token,userData.authResponse.userID,facebookUser).then(function(result){
								if (result===true) {
									status.user.status='ACTIVE';
									$localStorage.showProfileFillup = false;
									$rootScope.refreshFlag=true;
									kendo.mobile.application.hideLoading();
									kendo.mobile.application.replace('#view-dashboard');
								}
								else if (result.redirect){
									kendo.mobile.application.hideLoading();
									kendo.mobile.application.replace('view-become-member-facebook-linking.html');
								}
								else if (result.register===true){
									kendo.mobile.application.hideLoading();
									kendo.mobile.application.replace('view-become-member.html');
								}
								else if(result.error){
									kendo.mobile.application.hideLoading();
									modal.error(result.error);
								}
						});
					});
				});
				kendo.mobile.application.hideLoading();
				$scope.data.disableFBLogin=false;

			}, function loginError(error){
				kendo.mobile.application.hideLoading();
				$scope.data.disableFBLogin=false;
			}
		);	
	};

});
