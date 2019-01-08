app.controller('ConversationGalleryCtrl', function ($scope, messengerService) {

    if (!$scope.data) {

        $scope.data={
            loading: true,
            user_id: null,
            mediaOptions: {
                template: $('#template-media-gallery-item').html(),
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: 'Photo1'
                        }
                    ]
                }),
                page: 0,
                enablePager: true,
                contentHeight: '100%'
            }
        };

        $scope.data.showMedia = function(dataItem) {
            if (dataItem.mediaType != 'VIDEO') {
                return false;
            }
            var fileName = decodeURIComponent(dataItem.nativeURL.replace('file://','file:'));

            if (!isIos() && false) {
                cordova.plugins.bridge.open(fileName,function(){
                },function() {
                    modal.error("Can't open file");
                });
            } else {
                cordova.plugins.disusered.open(fileName,function(){
                },function() {
                    modal.error("Can't open file");
                });
            }
            return false;
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.user_id = kendoEvent.view.params.user_id;
            $scope.data.message_id = kendoEvent.view.params.message_id;

            if (isCordova()) {
                var mediaTypes = ['IMAGE'];
                messengerService.getConversationFiles($scope.data.user_id, mediaTypes,
                    function(files) {
                        var mediaObjects = [];

                        angular.forEach(files, function(file) {
                            var m = file.name.match(/[^\-]+\-\d+\-(\d+)\.[^\.]+$/);
                            var messageId = 0;
                            if (m) {
                                messageId = parseInt(m[1]);
                            }
                            mediaObjects.push({
                                name: file.name,
                                image: file.nativeURL,
                                file: file.nativeURL,
                                mediaType: file.mediaType,
                                messageId: messageId
                            });
                        });

                        var sortedMediaObjects = mediaObjects.sort(function(a, b) {
                            return a.messageId - b.messageId;
                        });

                        var scrollTo = 0;
                        angular.forEach(sortedMediaObjects, function(file, index) {
                            if (file.messageId == $scope.data.message_id) {
                                scrollTo = index;
                                return false;
                            }
                        });

                        $scope.data.mediaOptions.page = scrollTo;
                        $scope.data.mediaOptions.dataSource.data(sortedMediaObjects);
                        $scope.mediaGallery.scrollTo(scrollTo);

                        $scope.data.loading = false;
                    },
                    function(error) {
                        modal.error(error);
                    }
                );
            } else {
                var mediaObjects = [
                    {
                        name: 'Image 1',
                        image: 'http://jugl_app.loc2/www/img/interests_details1.jpg'
                    },
                    {
                        name: 'Image 2',
                        image: 'http://jugl.loc22/thumbs/0c/files_03%25252F33%25252F39%25252F3333963_83e820ebeffa55983a63f1c8bef438830442307d.jpg_searchRequest_0.jpg'
                    },
                    {
                        name: 'Image 3',
                        image: 'http://jugl_app.loc2/www/img/interests_details3.jpg'
                    },
                    {
                        name: 'Image 4',
                        image: 'http://jugl.loc22/thumbs/0a/files_03%25252F33%25252F38%25252F3333851_0c623ba8a5cb947cb2448e414f12f170f8c8b8ca.jpg_searchRequest_0.jpg'
                    }
                ];
                $scope.data.mediaOptions.dataSource.data(mediaObjects);
                $scope.mediaGallery.scrollTo(2);
                $scope.data.loading = false;
            }
        };
    }
});
