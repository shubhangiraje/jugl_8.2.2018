app.controller('PhotoSwipePopupCtrl', function ($scope,modal,$timeout,$rootScope) {

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

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.showGallery = false;

            if(kendoEvent.target.attr('data-url')) {
                $scope.data.phoroSwipeUrl=kendoEvent.target.attr('data-url');
                kendo.mobile.application.showLoading();
                $timeout(function () {
                    var image=new Image();
                    image.onload=function(){
                        $scope.data.slides = [
                            {
                                src: $scope.data.phoroSwipeUrl,
                                w: image.width,
                                h: image.height
                            }
                        ];

                        $scope.data.opts.index = 0;

                        $timeout(function () {
                            $scope.data.showGallery = true;
                            kendo.mobile.application.hideLoading();
                        });
                    };
                    image.src=$scope.data.phoroSwipeUrl;
                });
            }

            if(kendoEvent.target.attr('data-urls')) {
                var pictures = JSON.parse(kendoEvent.target.attr('data-urls'));

                var indexPicture = 0;
                if(kendoEvent.target.attr('data-index')) {
                    indexPicture = parseInt(kendoEvent.target.attr('data-index'));
                }

                var picturesObjects = [];
                kendo.mobile.application.showLoading();
                $timeout(function () {
                    var loadLeftPictures=pictures.length;
                    var idx=0;
                    angular.forEach(pictures, function (file) {
                        var img = new Image();
                        var idx2=idx++;
                        img.onload = function () {
                            picturesObjects[idx2]={
                                src: file,
                                w: img.width,
                                h: img.height
                            };

                            loadLeftPictures--;
                            if (loadLeftPictures===0) {
                                $scope.data.slides = picturesObjects;
                                $scope.data.opts.index = indexPicture;

                                $timeout(function () {
                                    $scope.data.showGallery = true;
                                    kendo.mobile.application.hideLoading();
                                });
                            }
                        };
                        img.src=file;
                    });
                    pictures=[];
                });

            }



        };

        $scope.data.sharing = function() {
            var shareSrc=$scope.data.currentItem.src;
            window.plugins.socialsharing.share(null, null, shareSrc, null);
        };

        $scope.data.close = function() {
            $scope.data.showGallery = false;
            $('#view-photo-swipe-popup').kendoMobileModalView('close');
        };


    } else {
        $scope.data.showGallery = false;
    }

});