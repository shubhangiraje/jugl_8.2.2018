app.controller('BecomeMemberCtrl', function ($scope,$rootScope,$log,$timeout,modal,jsonDataPromise,jsonPostDataPromise,auth,gettextCatalog,$localStorage, status) {

    if (!$scope.data) {

        $scope.data = {
            user : {
                first_name:'',
				last_name:'',
				gender:'',
				city:'',
				birthday:'',
				email: '',
                email_repeat: '',
                password: '',
                password_repeat: '',
				country_id:null,
            },
			model: null,
			countries: [],
			showLinkingFacebook:false
			
        };
		
		var facebook_id=null;
		

        $scope.data.onShow=function(kendoEvent) {
            refresh(kendoEvent);
        };

        /*jshint -W082 */
		function refresh(kendoEvent){

			if (isCordova()) {
                facebookConnectPlugin.getLoginStatus(function (res){
                    if(res.status === "connected"){
                        var permissions=['email','public_profile','user_location','user_birthday'];
                        facebookConnectPlugin.api("/me?fields=id,first_name,last_name,email,gender,birthday,location",permissions, function(response) {
                            facebook_id=response.id;
                            $scope.data.showLinkingFacebook=true;
                            if(response.first_name){
                                $scope.data.user.first_name = response.first_name;
                            }
                            if(response.last_name){
                                $scope.data.user.last_name = response.last_name;
                            }
                            if(response.email){
                                $scope.data.user.email = response.email;
                                $scope.data.user.email_repeat = response.email;
                            }
                            if(response.gender){
                                if(response.gender=="female"){
                                    $scope.data.user.sex = 'F';
                                }
                                if(response.gender=="male"){
                                    $scope.data.user.sex = 'M';
                                }
                            }
                            if(response.location){
                                $scope.data.user.city = response.location.name;
                            }
                            if(response.birthday){
                                var birth_dates=response.birthday.split("/");
                                $scope.data.user.birth_day = birth_dates[1];
                                $scope.data.user.birth_month =birth_dates[0];
                                $scope.data.user.birth_year = birth_dates[2];
                            }
                        });
                    } else {
                        $scope.data.showLinkingFacebook=false;
                        $scope.data.user.first_name = '';
                        $scope.data.user.last_name = '';
                        $scope.data.user.sex = '';
                        $scope.data.user.city = '';
                        $scope.data.user.birth_day = '';
                        $scope.data.user.birth_month = '';
                        $scope.data.user.birth_year = '';
                        $scope.data.user.password = '';
                        $scope.data.user.email= '';
                        $scope.data.user.email_repeat = '';
                        $scope.data.user.password_repeat = '';
                    }

                }, function error(){
                    $scope.data.showLinkingFacebook=false;
                    $scope.data.user.first_name = '';
                    $scope.data.user.last_name = '';
                    $scope.data.user.sex = '';
                    $scope.data.user.city = '';
                    $scope.data.user.birth_day = '';
                    $scope.data.user.birth_month = '';
                    $scope.data.user.birth_year = '';
                    $scope.data.user.password = '';
                    $scope.data.user.email= '';
                    $scope.data.user.email_repeat = '';
                    $scope.data.user.password_repeat = '';
                });
			}

			$scope.data.model=null;
			
			jsonDataPromise('/ext-api-country-registration/get-list')
				.then(function (res) {
				    $scope.data.countries = res.countries;
				    $scope.data.user.country_id = res.country_id;
					$scope.data.loading=false;
				},function(){
					$scope.data.loading=false;
             	});

		}
        /*jshint +W082 */
		
        $scope.data.save = function() {
		    $rootScope.refreshFlag=true;
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-become-member/save-new', {user: $scope.data.user,fb_id:facebook_id})
                    .then(function (res) {
                        console.log(res);
                        if (res.result) {
                            kendo.mobile.application.hideLoading();
                            /*$timeout(function(){
                                modal.alert(gettextCatalog.getString('Vielen Dank für Deine Registrierung! Wir wünschen Dir viel Spaß und Erfolg auf Jugl.net.'));
                                kendo.mobile.application.replace('#view-login');
                            });*/
                            $timeout(function(){
								auth.login($scope.data.user.email,$scope.data.user.password).then(function(result){
									if (result===true) {
										kendo.mobile.application.hideLoading();
										status.user.status='ACTIVE';
										$localStorage.showProfileFillup = false;
										kendo.mobile.application.replace('#view-dashboard');
									} else {
										modal.error(result);
									}
								});
							 });
                            
                        } else {
							
                            modal.showErrors(res.user.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });
        };
		
		$scope.data.saveFacebook = function() {
			$rootScope.refreshFlag=true;
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-become-member/save-facebook', {user: $scope.data.user,fb_id:facebook_id})
                    .then(function (res) {
                        if (res.result) {
                            kendo.mobile.application.hideLoading();							
                            $timeout(function(){
								auth.login($scope.data.user.existing_account,$scope.data.user.existing_password).then(function(result){
									if (result===true) {
										kendo.mobile.application.hideLoading();
										status.user.status='ACTIVE';
										$localStorage.showProfileFillup = false;
										kendo.mobile.application.replace('#view-dashboard');
									} else {
										modal.error(result);
									}
								});
							 });
                            
                        } else {
							
                            modal.showErrors(res.user.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });
        };
		
		this.registerWithFacebook=function(){
		$rootScope.refreshFlag=true;			
		kendo.mobile.application.showLoading();
		$scope.data.disableFBLogin=true;
		var permissions=['email','public_profile','user_location','user_birthday'];

		    if (isCordova()) {
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
                                        kendo.mobile.application.navigate('#view-dashboard');
                                    }
                                    else if (result.redirect){
                                        kendo.mobile.application.navigate('view-become-member-facebook-linking.html');
                                    }
                                    else if (result.register===true){
                                        kendo.mobile.application.navigate('view-become-member.html');
                                        refresh();
                                    }
                                    else if(result.error){
                                        modal.error(result.error);
                                    }
                                });
                            });
                        });
                        kendo.mobile.application.hideLoading();
                        $scope.data.disableFBLogin=false;
                    }, function loginError(error) {
                        console.error(error);
                    }
                );
            }


		};


    }

});



