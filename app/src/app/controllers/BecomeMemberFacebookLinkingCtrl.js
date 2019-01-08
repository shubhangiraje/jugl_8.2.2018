app.controller('BecomeMemberFacebookLinkingCtrl', function ($scope,$log,$timeout,modal,jsonDataPromise,jsonPostDataPromise,auth,gettextCatalog,$localStorage,status) {

    if (!$scope.data) {

        $scope.data = {
            user : { 
				email: '',
                password: ''
            }

        };
		
		var facebook_id=null;
		

        $scope.data.onShow=function(kendoEvent) {
            
			facebookConnectPlugin.getLoginStatus(function (res){
				if(res.status === "connected"){
					var permissions=['email','public_profile','user_location','user_birthday'];
					facebookConnectPlugin.api("/me?fields=id,first_name,last_name,email,gender,birthday,location",permissions, function(response) {
						facebook_id=response.id;

						if(response.email){
							$scope.data.user.existing_account=response.email;
						}
					});
				}
			}, function error(){
				
			});						

        };

        
		
		$scope.data.saveFacebook = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-become-member/save-facebook', {user: $scope.data.user,fb_id:facebook_id})
                    .then(function (res) {
                        if (res.result) {
                            kendo.mobile.application.hideLoading();							
                            $timeout(function(){
								facebookConnectPlugin.getAccessToken(function(access_token) {
									auth.loginFacebook(access_token,facebook_id).then(function(result){							
											if (result===true) {	
												status.user.status='ACTIVE';
												$localStorage.showProfileFillup = false;
												kendo.mobile.application.replace('#view-dashboard');
											}																					
									});
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


    }

});



