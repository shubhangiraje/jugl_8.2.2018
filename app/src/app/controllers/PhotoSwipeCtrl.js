app.controller('PhotoSwipeCtrl', function($scope,messengerService,$timeout,$rootScope,$log) {

    if (!$scope.data) {

        $scope.data = {
            slides: '',
            opts: {
                index: 0,
                history: false,
                loop: false,
                clickToCloseNonZoomable: false,
                tapToClose: false,
                pinchToClose: false,
                closeElClasses: false,
                closeOnScroll: false,
                closeOnVerticalDrag: false,
                counterEl: false,
                hideAnimationDuration:0,
                showAnimationDuration:0
            },
            showGallery: false
        };

        $scope.data.onShow = function (kendoEvent) {

            $scope.data.user_id = kendoEvent.view.params.user_id;
            $scope.data.message_id = kendoEvent.view.params.message_id;
            $scope.data.canShare=true;

            if (!kendoEvent.view.params.url && !kendoEvent.view.params.urls && !kendoEvent.view.params.isGallery) {
                $timeout(function(){
                    kendo.mobile.application.showLoading();
                });

                if (isCordova()) {
                    var mediaTypes = ['IMAGE'];
                    messengerService.getConversationFiles($scope.data.user_id, mediaTypes,
                        function (files) {

                            $log.debug('gallery files');
                            $log.debug(files);

                            var slidesObjects = [];

                            var responsesLeft = files.length;

                            function imgLoaded() {
                                responsesLeft--;

                                if (responsesLeft === 0) {
                                    var sortedMediaObjects = slidesObjects.sort(function (a, b) {
                                        return a.messageId - b.messageId;
                                    });

                                    var currentIndex = 0;
                                    angular.forEach(sortedMediaObjects, function (file, index) {
                                        if (file.messageId == $scope.data.message_id) {
                                            currentIndex = index;
                                            return false;
                                        }
                                    });

                                    $log.debug('gallery');
                                    $log.debug(sortedMediaObjects);
                                    $log.debug($scope.data.message_id);
                                    $log.debug(currentIndex);

                                    $scope.data.slides = sortedMediaObjects;
                                    $scope.data.opts.index = currentIndex;

                                    $timeout(function () {
                                        $scope.data.showGallery = true;
                                        kendo.mobile.application.hideLoading();
                                    });
                                }
                            }

                            angular.forEach(files, function (file) {
                                var m = file.name.match(/[^\-]+\-\d+\-(\d+)\.[^\.]+$/);
                                var messageId = 0;
                                if (m) {
                                    messageId = parseInt(m[1]);
                                }

                                var nativeURL = file.nativeURL;

                                var img = new Image();
                                img.onload = function () {
                                    slidesObjects.push({
                                        src: nativeURL,
                                        w: img.width,
                                        h: img.height,
                                        messageId: messageId
                                    });

                                    imgLoaded();
                                };
                                img.onerror = function () {
                                    slidesObjects.push({
                                        src: nativeURL,
                                        w: 200,
                                        h: 200,
                                        messageId: messageId
                                    });

                                    imgLoaded();
                                };
                                img.src = nativeURL;
                            });

                            $log.debug('slides objects');
                            $log.debug(slidesObjects);
                        },
                        function (error) {
                            modal.error(error);
                        }
                    );
                } else {

                    $scope.data.slides = [
                        {
                            src: 'http://jugl_app.loc2/www/img/interests_details1.jpg',
                            w: 960,
                            h: 800
                        },
                        {
                            src: 'http://jugl_app.loc2/www/img/interests_details2.jpg',
                            w: 960,
                            h: 800
                        },
                        {
                            src: 'http://jugl_app.loc2/www/img/interests_details3.jpg',
                            w: 960,
                            h: 800
                        }
                    ];

                    $scope.data.opts.index = 0;

                    $scope.data.showGallery = false;
                    $timeout(function () {
                        $scope.data.showGallery = true;
                        kendo.mobile.application.hideLoading();
                    });

                }
            } else {
                $scope.data.canShare=false;
                $scope.data.showGallery = false;

                if(kendoEvent.view.params.url) {
                    $timeout(function () {
                        var image=new Image();
                        image.onload=function(){
                            $scope.data.slides = [
                                {
                                    src: kendoEvent.view.params.url,
                                    w: image.width,
                                    h: image.height
                                }
                            ];

                            $scope.data.opts.index = 0;

                            $timeout(function () {
                                $scope.data.showGallery = true;
                            });
                        };

                        image.src=kendoEvent.view.params.url;
                    });
                }

                if(kendoEvent.view.params.urls) {

                    var photosObjects = [];
                    var userPhotos = $rootScope.userPhotos;
                    $timeout(function () {
                        var loadLeftUserPhotos=userPhotos.length;
                        var idx=0;
                        angular.forEach(userPhotos, function (file) {
                            var img = new Image();
                            var idx2=idx++;
                            img.onload = function () {
                                photosObjects[idx2]={
                                    src: file,
                                    w: img.width,
                                    h: img.height
                                };

                                loadLeftUserPhotos--;
                                if (loadLeftUserPhotos===0) {
                                    $scope.data.slides = photosObjects;
                                    $scope.data.opts.index = index;

                                    $timeout(function () {
                                        $scope.data.showGallery = true;
                                    });
                                }
                            };
                            img.src=file;
                        });
                        $rootScope.userPhotos=[];
                    });

                }

                if(kendoEvent.view.params.isGallery) {

                    var index = $rootScope.imagesGallery.index;
                    var imagesGallery = $rootScope.imagesGallery.images;

                    var galleryObjects = [];
                    $timeout(function () {
                        var loadLeft=imagesGallery.length;
                        var idx=0;
                        angular.forEach(imagesGallery, function (file) {
                            var img = new Image();
                            var idx2=idx++;
                            img.onload = function () {
                                galleryObjects[idx2]={
                                    src: file,
                                    w: img.width,
                                    h: img.height
                                };

                                loadLeft--;
                                if (loadLeft===0) {

                                    $scope.data.slides = galleryObjects;
                                    $scope.data.opts.index = index;

                                    $timeout(function () {
                                        $scope.data.showGallery = true;
                                    });
                                }
                            };
                            img.src=file;
                        });
                        $rootScope.imagesGallery=[];
                    });
                }



            }

        };


        $scope.data.back = function() {
            if ($scope.data.user_id) {
                kendo.mobile.application.navigate('view-chat.html?id='+$scope.data.user_id);
            } else {
                kendo.mobile.application.navigate('#:back');
            }
        };

        $scope.data.sharing = function() {
            var shareSrc=$scope.data.currentItem.src;
            window.plugins.socialsharing.share(null, null, shareSrc, null);
        };


    } else {
        $scope.data.showGallery = false;
    }

});



