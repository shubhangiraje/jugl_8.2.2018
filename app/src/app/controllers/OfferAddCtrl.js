app.controller('OfferAddCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,$timeout,$interval,modal,$rootScope,uploadService,gettextCatalog,$log,$cordovaCamera) {

    function startsWith(str,substr) {
        return (typeof str === 'string') && str.indexOf(substr)===0;
    }

    function loadReceiversCount() {
        loadingReceiversCount=true;

        jsonPostDataPromise('/ext-api-offer/get-receivers-count', {offer: $scope.data.offer}).then(function(data){
            loadingReceiversCount=false;
            if (loadReceiversCountAfterLoading) {
                loadReceiversCountAfterLoading=false;
                loadReceiversCount();
            }
            $scope.data.offer.receiversCount=data.receiversCount;
        },function(){
            loadingReceiversCount=false;
            if (loadReceiversCountAfterLoading) {
                loadReceiversCountAfterLoading=false;
                loadReceiversCount();
            }
        });
    }
	
	function loadReceiversAllCount() {
        loadingReceiversAllCount=true;

        jsonPostDataPromise('/ext-api-offer/get-receivers-all-count', {offer: $scope.data.offer}).then(function(data){
            loadingReceiversAllCount=false;
            if (loadReceiversAllCountAfterLoading) {
                loadReceiversAllCountAfterLoading=false;
                loadReceiversAllCount();
            }
            $scope.data.offer.receiversAllCount=data.receiversAllCount;
        },function(){
            loadingReceiversAllCount=false;
            if (loadReceiversAllCountAfterLoading) {
                loadReceiversAllCountAfterLoading=false;
                loadReceiversAllCount();
            }
        });
    }
	
    function syncPrice(offer,oldValue) {
        if (oldValue && Math.abs(oldValue-offer.notify_if_price_bigger*2)>0.01) {
            return;
        }
        if (!offer.price) {
            delete offer.notify_if_price_bigger;
        } else {
            offer.notify_if_price_bigger=Math.floor(offer.price/2*100+0.5)/100;
        }
    }


    if (!$scope.data) {

        $scope.data={
            offer: {},
            fileUpload: true
        };

        var intervalSaveDraft = null;

        $scope.$watch('data.offer.type',function(newValue) {
            var offer=$scope.data.offer;
            if (newValue!='AUCTION') {
                delete $scope.data.offer.notify_if_price_bigger;
            } else {
                syncPrice(offer);
            }
        });

        $scope.$watch('data.offer',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.isSaveDraft = true;
            }

            if (oldValue.without_view_bonus) {
                var showWarning=false;
                for(var key in newValue) {
                    if (key.indexOf("uf_")===0 && newValue[key]) {
                        newValue[key]='';
                        showWarning=true;
                    }
                }

                if (showWarning) {
                    modal.alert({message:gettextCatalog.getString('Nur mit Werbebudget möglich')});
                }
            }
        },true);

        $scope.$watch('data.offer.without_view_bonus',function(newVal,oldVal) {
            if (!oldVal && newVal) {
                $scope.data.offer.view_bonus=null;
                $scope.data.offer.view_bonus_total=null;

                for(var key in $scope.data.offer) {
                    if (key.indexOf("uf_")===0) {
                        delete $scope.data.offer[key];
                    }
                }
            }
        });


        $scope.$watch('data.offer.price',function(newValue,oldValue) {

            if(newValue && $scope.data.pricePopup) {
                modal.alert(gettextCatalog.getString('Hinweis für Händler! Bitte achte darauf, dass Du bei Jugl nichts teurer anbietest, als Du es auf anderen Websites tust.'));
                $scope.data.pricePopup = false;
            }

            var offer=$scope.data.offer;
            if (offer.type!='AUCTION') return;
            syncPrice(offer,oldValue);
        });

        $scope.$watch('data.offer.buy_bonus',function(newValue) {
            $scope.data.offer.buy_bonus_provision=Math.floor($scope.data.SELLBONUS_SELLER_PARENTS_PERCENT*newValue+0.5)/100;
        });

        $scope.data.onShow = function(kendoEvent) {

            kendo.mobile.application.view().scroller.scrollTo(0, 0);

            $scope.data.offer = {
                without_view_bonus: false,
                show_amount: false,
                pay_allow_paypal: false,
                pay_allow_bank: false,
                pay_allow_jugl: false,
                pay_allow_pod: false,
                view_bonus_interest: 1
            };

            $scope.data.pricePopup = true;
            $scope.data.isSaveDraft = false;

            var ids = '';
            if (kendoEvent.view.params.ids) {
                ids = kendoEvent.view.params.ids;
                $scope.data.isSaveDraft = true;
            } else {
                $rootScope.offerDraftId = null;
            }
            
            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-offer/add', {ids: ids})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $scope.data.offer.pay_allow_paypal=!!$scope.data.offer.pay_allow_paypal;
                        $scope.data.offer.pay_allow_bank=!!$scope.data.offer.pay_allow_bank;
                        $scope.data.offer.pay_allow_jugl=!!$scope.data.offer.pay_allow_jugl;
                        $scope.data.offer.pay_allow_pod=!!$scope.data.offer.pay_allow_pod;
                        if(ids) {
                            $scope.data.pricePopup = false;
                            angular.extend($scope.data.offer, $rootScope.oldOfferAddData);
                        }

                        if($rootScope.offerSaveData) {
                            angular.extend($scope.data.offer, $rootScope.offerSaveData);
                            $scope.data.pricePopup = false;
                            $rootScope.offerSaveData = null;
                        }

                        if($scope.data.offer.offerInterests[0].level2Interest.offer_view_bonus) {
                            $scope.data.offer.view_bonus_interest = $scope.data.offer.offerInterests[0].level2Interest.offer_view_bonus;
                        } else {
                            $scope.data.offer.view_bonus_interest = $scope.data.offer.offerInterests[0].level1Interest.offer_view_bonus;
                        }

                        if(!$scope.data.offer.view_bonus_interest) {
                            $scope.data.offer.view_bonus_interest = 1;
                        }
						
						if($scope.data.offer.offerInterests[0].level2Interest.offer_view_total_bonus) {
                            $scope.data.offer.view_bonus_total_interest = $scope.data.offer.offerInterests[0].level2Interest.offer_view_total_bonus;
                        } else {
                            $scope.data.offer.view_bonus_total_interest = $scope.data.offer.offerInterests[0].level1Interest.offer_view_total_bonus;
                        }

                        if(!$scope.data.offer.view_bonus_total_interest) {
                            $scope.data.offer.view_bonus_total_interest = 1;
                        }

                        $scope.data.offer.without_view_bonus = !$rootScope.marketingEnabled;

                        intervalSaveDraft=$interval(function(){
                            if($scope.data.isSaveDraft) {
                                if(!$rootScope.offerDraftId) {
                                    jsonPostDataPromise('/ext-api-offer-draft/save', {offer: $scope.data.offer}).then(function (res) {
                                        $rootScope.offerDraftId = res.id;
                                    });
                                } else {
                                    jsonPostDataPromise('/ext-api-offer-draft/update', {id: $rootScope.offerDraftId, offer: $scope.data.offer}).then(function (res) {});
                                }
                                $scope.data.isSaveDraft = false;
                            }
                        },10*1000);

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });

        };

        $scope.data.addInterests = function() {
            $rootScope.oldOfferAddData = angular.copy($scope.data.offer);
            delete $rootScope.oldOfferAddData.offerInterests;
            delete $rootScope.oldOfferAddData.offerParamValues;
            delete $rootScope.oldOfferAddData.$allErrors;
            delete $rootScope.oldOfferAddData.$errors;
            kendo.mobile.application.navigate('view-interests-addstep1.html?type=addOffer');
        };

        /*jshint -W083 */
        $scope.data.uploadImage = function() {
            var sourceType=Camera.PictureSourceType.PHOTOLIBRARY;
            var mediaType=Camera.MediaType.PICTURE;

            if (sourceType==Camera.PictureSourceType.PHOTOLIBRARY && mediaType==Camera.MediaType.PICTURE && !isWp()) {
                window.imagePicker.getPictures(
                    function(results) {
                        if (results.length===0) return;
                        for(var idx in results) {
                            $scope.data.fileUpload = false;
                            uploadService.upload({
                                uri: results[idx],
                                mediaType: mediaType
                            }).then(
                                function(data) {
                                    $scope.data.offer.files.push(data);
                                    $log.debug('Upload succes!');
                                    $scope.data.fileUpload = true;
                                },
                                function(error) {
                                    $log.error('Upload error: ' + error);
                                }
                            );
                        }

                    }, function (error) {
                        $log.error('Error: ' + error);
                    }, {
                        maximumImagesCount: 30,
                        width: 1280,
                        height: 1280,
                        quality: 70
                    }
                );

                return;
            }

            $cordovaCamera.getPicture({
                quality: mediaType==Camera.MediaType.PICTURE ? 70:30,
                allowEdit: mediaType==Camera.MediaType.VIDEO,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: sourceType,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: mediaType==Camera.MediaType.PICTURE ? 1280:480,
                targetHeight: mediaType==Camera.MediaType.PICTURE ? 1280:480,
                saveToPhotoAlbum: false,
                mediaType: mediaType
            }).then(function(uri){
                $scope.data.fileUpload = false;
                uploadService.upload({
                    uri: uri,
                    mediaType: mediaType
                }).then(
                    function(data) {
                        $scope.data.offer.files.push(data);
                        $log.debug('Upload succes!');
                        $scope.data.fileUpload = true;
                    },
                    function(error) {
                        $log.error('Upload error: ' + error);
                    }
                );
            });

        };
        /*jshint +W083 */


        $scope.data.deleteFile = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchten Sie diese bild löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                for (var i in $scope.data.offer.files) {
                    if ($scope.data.offer.files[i].id == id) {
                        $scope.data.offer.files.splice(i, 1);
                        break;
                    }
                }
            });
        };

        var loadingReceiversCount=false;
        var loadReceiversCountAfterLoading=false;

        $scope.$watch(function(){
            var obj={};
            for(var key in $scope.data.offer) {
                if (startsWith(key,'uf_')) {
                    obj[key]=$scope.data.offer[key];
                }
            }
            return angular.toJson(obj);
        },function(){
            if (loadingReceiversCount) {
                loadReceiversCountAfterLoading=true;
                return;
            }

            loadReceiversCount();
        });
		
		
		var loadingReceiversAllCount=false;
        var loadReceiversAllCountAfterLoading=false;

        $scope.$watch(function(){
            var obj={};
            for(var key in $scope.data.offer) {
                if (startsWith(key,'uf_')) {
                    obj[key]=$scope.data.offer[key];
                }
            }
            return angular.toJson(obj);
        },function(){
            if (loadingReceiversAllCount) {
                loadReceiversAllCountAfterLoading=true;
                return;
            }

            loadReceiversAllCount();
        });

        $scope.data.preview = function() {
            $scope.data.isSaveDraft = false;
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-offer/preview', {offer: $scope.data.offer})
                    .then(function (res) {
                        if(res.result) {
                            $interval.cancel(intervalSaveDraft);
                            $rootScope.offerSaveData = angular.copy($scope.data.offer);
                            delete $rootScope.offerSaveData.$allErrors;
                            delete $rootScope.offerSaveData.$errors;
                            $rootScope.offerPreviewData = res.offer;
                            if($rootScope.offerDraftId) {
                                kendo.mobile.application.navigate('view-offers-preview.html?draft_id='+$rootScope.offerDraftId);
                            } else {
                                kendo.mobile.application.navigate('view-offers-preview.html');
                            }
                            kendo.mobile.application.hideLoading();
                        } else {
                            $scope.data.offer.$errors = res.offer.$errors;
                            modal.showErrors(res.offer.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        $scope.data.onHide = function(kendoEvent) {
            $interval.cancel(intervalSaveDraft);
        };


    }

});