app.factory('ChatUploader',function(FileUploader,modal,updateAuthHeaders,$log, gettextCatalog) {
    return function(thumbs) {
        if (typeof thumbs === 'undefined') thumbs=[];

        var data={
            thumbs: thumbs
        };

        var uploaderConfig={
            url: config.urls.chatFileUpload,
            formData: [data],
            autoUpload: true
        };

        var uploader=new FileUploader(uploaderConfig);

        uploader.filters.push({
            name: 'imageFilter',
            fn: function(item, options) {
                // on android item.type is always empty string :-(
                if (!isAndroid()) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';

                    if ('|jpg|png|jpeg|'.indexOf(type.toLowerCase()) === -1) {
                        modal.alert({
                            title: gettextCatalog.getString('Image upload'),
                            message: gettextCatalog.getString('Sie können nur die Bilder mit folgenden Erweiterungen hochladen: .JPG, .JPEG, .PNG')
                        });
                        return false;
                    }
                }

                if (item.size>50*1024*1024) {
                    modal.alert({
                        title: gettextCatalog.getString('Image upload'),
                        message: gettextCatalog.getString('Die Datei darf nicht größer als 50Mb sein')
                    });
                    return false;
                }

                updateAuthHeaders(uploader.headers);

                $log.debug('started fileupload');

                return true;
            }
        });

        return uploader;
    };
});
