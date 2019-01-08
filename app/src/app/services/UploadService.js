var uploadService=angular.module('UploadService', []);

uploadService.factory('uploadService', function(settingsService,$cordovaCamera,modal,updateAuthHeaders,$cordovaFileTransfer,$log,$q,$timeout,gettextCatalog,status,userNameFilter,$cordovaFile,$filter) {

    var factory = {
        mediaPathCache: {}
    };

    factory.retryUploadFile = function(object) {
        var q = $q.defer();
        object.triesLeft = 3;
        uploadProcess(object)
            .then(
                function(data) {
                    q.resolve(data);
                },
                function(error) {
                    q.reject(error);
                }
            );
        return q.promise;
    };

    function uploadFailed(object, info) {
        var q = $q.defer();
        $log.error('file upload failed');
        $log.error(info);

        object.triesLeft--;
        if (object.triesLeft > 0) {
            $timeout(function() {
                uploadProcess(object)
                    .then(
                        function(data) {
                            q.resolve(data);
                        },
                        function(error) {
                            q.reject(error);
                        }
                    );
            }, 5000);
            return q.promise;
        }
        return q.promise;
    }

    function uploadProcess(object) {
        var q = $q.defer();

        var headers = {};
        updateAuthHeaders(headers);

        var fileName = object.uri.replace(/^.*[\\/]/,'');
        if (!fileName.match(/.*\.[a-zA-Z0-9]{3,4}$/)) {
            if (object.mediaType == Camera.MediaType.PICTURE) {
                fileName = fileName + '.jpg';
            }
            if (object.mediaType == Camera.MediaType.VIDEO) {
                fileName = fileName + '.mp4';
            }
        }

        $cordovaFileTransfer.upload(
            config.urls.fileUpload,
            object.uri,
            {
                headers: headers,
                // required for windows phone
                fileKey: 'file',
                fileName: fileName
            },
            true
        )
        .then(
            function(data) {
                $log.debug('UPLOAD FINISHED');
                $log.debug(response);

                var response;
                try {
                    if (data.responseCode!=200) {
                        throw true;
                    }
                    response = angular.fromJson(data.response);
                } catch (e) {
                    uploadFailed(object, e)
                        .then(
                            function(data) {
                                q.resolve(data);
                            },
                            function(error) {
                                q.reject(error);
                            }
                        );
                    return;
                }

                $log.debug('file upload succeeded');
                $log.debug(data);

                if (response.id) {
                    q.resolve(response);
                } else {
                    //modal.error("file upload error: " + response.error);
                    modal.error(gettextCatalog.getString('Fehler beim Hochladen der Datei.'));
                    q.reject(false);
                }
            },

            function(data) {
                uploadFailed(object, data)
                    .then(
                        function(data) {
                            q.resolve(data);
                        },
                        function(error) {
                            q.reject(error);
                        }
                    );
            }
        );

        return q.promise;
    }

    factory.run = function(sourceType, mediaType, extraData) {
        var q = $q.defer();

        settingsService.ignoreLogoutOnNextPause();

        var cameraSettings = {
            quality: mediaType==Camera.MediaType.PICTURE ? 70:30,
            allowEdit: mediaType==Camera.MediaType.VIDEO,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: sourceType,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: mediaType==Camera.MediaType.PICTURE ? 1280:480,
            targetHeight: mediaType==Camera.MediaType.PICTURE ? 1280:480,
            saveToPhotoAlbum: false,
            mediaType: mediaType
        };

        if (angular.isObject(extraData)) {
            angular.extend(cameraSettings, extraData);
        }

        $cordovaCamera.getPicture(cameraSettings)
            .then(
                function(uri){
                    factory.upload({
                        uri: uri,
                        mediaType: mediaType
                    }).then(
                        function(data) {
                            q.resolve(data);
                        },

                        function(error) {
                            q.reject(error);
                        }
                    );
                },

                function(error) {
                    q.reject(error);
                }
            );

        return q.promise;
    };

    factory.upload = function(object) {
        var q = $q.defer();

        object.triesLeft = 3;

        if (isAndroid()) {
            if(!object.uri.match(/file:/g)) {
                object.uri = 'file:'+object.uri;
            }
        }

        window.resolveLocalFileSystemURL(object.uri, function(fileEntry) {
            fileEntry.file(
                function(file) {
                    if (file.size>=50*1024*1024) {
                        modal.error(gettextCatalog.getString('Videos größer als 50 MB können nicht gesendet werden!'));
                        return q.reject(false);
                    }
                    uploadProcess(object)
                        .then(
                            function(data) {
                                q.resolve(data);
                            },

                            function(error) {
                                q.reject(error);
                            }
                        );
                },

                function(error) {
                    modal.error("can't get file size (2)");
                    q.reject(error);
                });
        }, function(error) {
            modal.error("can't get file size (1)");

            console.log(error);

            q.reject(error);
        });

        return q.promise;
    };




    factory.showMedia=function(file, content_type, obj_id) {
        if(isWp()) {
            var videoSrc = file.url;
            window.videoPlayer.show(videoSrc);
        } else {

            file.content_type = content_type;
            file.obj_id = obj_id;

            factory.checkAndLoadFile(file,function(fileEntry){
                openFile(fileEntry);
            });
        }
    };

    factory.checkAndLoadFile=function(file, successCallback) {

        if (!file || file.sending || file.uploading) return false;
        if (file.downloading) return false;
        if (!isCordova()) return false;

        if (file.fileEntry) {
            if (successCallback) successCallback(file.fileEntry);
            return;
        }

        file.checkingFile=true;
        factory.checkFileExist(file)
            .then(function (fileEntry) {
                $log.debug('file already exists');

                file.fileEntry={
                    nativeURL:isWp() ? fileEntry.fullPath:fileEntry.nativeURL,
                    fullPath:fileEntry.fullPath
                };
                file.checkingFile=false;
                if (successCallback) successCallback(fileEntry);
            }, function (error) {
                file.checkingFile=false;
                $log.debug('start download');
                file.downloading=true;
                factory.loadFileContent(file)
                    .then(function(fileEntry) {
                        $log.debug('file downloaded successfully');
                        file.downloading=false;
                        factory.checkFileExist(file)
                            .then(function (fileEntry) {
                                file.fileEntry={
                                    nativeURL:fileEntry.nativeURL,
                                    fullPath:fileEntry.fullPath
                                };

                                // force media scanner to index file
                                if (isAndroid()) {
                                    $log.debug('mediaScanner index file '+fileEntry.nativeURL);
                                    cordova.plugins.MediaScannerPlugin.scanFile(fileEntry.nativeURL, function() {
                                        $log.debug('indexing completed successfully');
                                    },function (error) {
                                        $log.debug('indexing error:'+error);
                                    });
                                }
                                if (successCallback) successCallback(fileEntry);
                            });
                    }, function(error) {
                        $log.error('download failed');
                        file.downloading=false;
                    }, function (progress) {
                        file.progress=(progress.loaded/progress.total*100).toFixed(2)+'%';
                        //$log.debug('download progress '+message.progress);
                    });
            });
    };


    function openFile(fileEntry) {

        if (!isWp()) {
            window.resolveLocalFileSystemURL(fileEntry.nativeURL, function(fileEntry){
                fileEntry.file(function(file){
                        var fileName=decodeURIComponent(fileEntry.nativeURL.replace('file://','file:'));

                        if (isWp()) {
                            fileName=fileEntry.nativeURL;
                        }

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
                    },
                    function(){
                        modal.error("Can't get file info (2)");
                    });
            }, function() {
                modal.error("can't get file info (1)");
            });
        } else {
            var uri=fileEntry.fullPath;
            uri=uri.replace(/^\/\//,'');
            uri='ms-appdata:///local/'+uri;
            $log.debug('try to open '+uri);

            cordova.plugins.fileOpener2.open(uri, 'video/mp4', {
                error : function(e) {
                    $log.error('fileOpener2: opening error: ' + e.message);
                },
                success : function () {
                    $log.debug('fileOpener2: file opened successfully');
                }
            });

        }
    }

    factory.checkFileExist = function(file) {
        var q = $q.defer();

        factory.getFileInfo(file)
            .then(
                function(info) {

                    $log.debug('checkFileExists');
                    $log.debug(info);
                    $cordovaFile.checkFile(info.root, info.targetPath).then(function(){
                        $log.debug('file exists, get size');
                        window.resolveLocalFileSystemURL(info.root+info.targetPath, function(fileEntry){
                            fileEntry.file(function(data){
                                    $log.debug('file size is '+data.size);
                                    $log.debug('message file size is '+file.size);
                                    if (data.size!=file.size) {
                                        $log.debug("sizes doesn't match, redownload");
                                        q.reject(false);
                                    } else {
                                        q.resolve(fileEntry);
                                    }
                                },
                                function(){
                                    modal.error("can't get file size (4)");
                                    q.reject();
                                });
                        }, function() {
                            modal.error("can't get file size (3)");
                            q.reject();
                        });

                    },function(error) {
                        $log.debug("file doesn't exist: "+error);
                        q.reject(error);
                    });

                },
                function(error) {
                    q.reject(error);
                }
            );

        return q.promise;
    };

    factory.loadFileContent = function(file) {
        if (!isCordova())
            return false;

        if (!file) {
            return false;
        }

        var q = $q.defer();

        factory.getFileInfo(file).then(function(info) {
            $cordovaFileTransfer.download(file.url, info.fullPath, {}, true).then(function(result) {
                q.resolve(result);
            }, function(error) {
                q.reject(error);
            }, function (progress) {
                q.notify(progress);
            });
        }, function(error) {
            q.reject(error);
        });


        return q.promise;
    };

    factory.getFileInfo = function(file) {

        var q = $q.defer();

        getMediaPath(file.content_type)
            .then(
                function(dirEntry) {
                    var fileName = generateFileName(file);
                    var path = dirEntry.fullPath.substring(isWp() ? 2:1);
                    var targetPath = path + fileName;
                    var root = getRootStorage();
                    var info = {
                        name: fileName,
                        root: root,
                        path: path,
                        targetPath: targetPath,
                        fullPath: root + (isWp() ? targetPath:targetPath.replace(/\s/g, '%20')),
                        mimetype: ''
                    };
                    return q.resolve(info);
                },
                function() {
                    q.reject("Can't get conversation media path to save file");
                }
            );

        return q.promise;
    };

    function getMediaPath(mediaType) {
        mediaType = angular.lowercase(mediaType);
        var root = getRootStorage();
        var path = getPath(mediaType);
        var q=$q.defer();
        var user_id = status.user.id;

        var defaultDirectoryName = userNameFilter(status.user) + '  ' + user_id;

        // check if exist cache for this media type
        if (angular.isUndefined(factory.mediaPathCache[mediaType])) {
            factory.mediaPathCache[mediaType] = {};
        }

        if (angular.isDefined(factory.mediaPathCache[mediaType][user_id])) {
            // check conversation directory in cache
            $log.debug('get from cache');
            defaultDirectoryName = factory.mediaPathCache[mediaType][user_id];
        }

        checkFilesDirectory(root + path + '/', defaultDirectoryName, false,
            function(dirEntry) {
                $log.debug('exist from cache');
                q.resolve(dirEntry);
            },
            function(error) {
                $log.debug('not exist from cache');
                checkFilesDirectory(root, path, true, function(dirEntry) {
                    var directoryReader = dirEntry.createReader();
                    directoryReader.readEntries(
                        function(entries) {
                            var expr = new RegExp('  (\\d+)$');
                            for (var i=0; i<entries.length; i++) {
                                if (!entries[i].isDirectory) {
                                    continue;
                                }
                                var m = entries[i].name.match(expr);
                                if (m) {
                                    // save conversation path in cache
                                    factory.mediaPathCache[mediaType][ parseInt(m[1]) ] = entries[i].name;
                                }
                                if (m && parseInt(m[1]) == user_id) {
                                    return q.resolve(entries[i]);
                                }
                            }
                            var dirName = userNameFilter(status.user) + '  ' + user_id;
                            createFilesDirectory(root + dirEntry.fullPath.substring(1), dirName, function(userDirEntry) {
                                factory.mediaPathCache[mediaType][user_id] = dirName;
                                q.resolve(userDirEntry);
                            });
                        },
                        function() {
                            q.reject(false);
                        }
                    );
                });
            }
        );

        return q.promise;
    }


    function generateFileName(file) {
        // Filename example: IMAGE-20150325.png
        return file.content_type + '-' + $filter('date')(new Date(), 'yyyyMMdd') + file.obj_id + '.' + file.ext;
    }

    function getRootStorage() {
        if (isCordova()) {
            if (isAndroid()) return cordova.file.externalRootDirectory || cordova.file.dataDirectory;
            if (isWp()) return '//';
            return  cordova.file.dataDirectory;
        }
    }

    factory.getRootStorage=getRootStorage;

    function getPath(mediaType) {

        var ct = angular.uppercase(mediaType.charAt(0)) + angular.lowercase(mediaType.substr(1));
        var path;

        if (!isWp()) {
            path='JuglApp/Media/Jugl ' + ct + 's';
        } else {
            path='Shared/Media/'+ct+'s';
        }

        return path;
    }

    function checkFilesDirectory(base_path, path, create, callback, fail_callback) {
        if (angular.isUndefined(fail_callback)) {
            fail_callback = function(error) {};
        }
        $cordovaFile.checkDir(base_path, path)
            .then(function (success) {
                callback(success);
            }, function (error) {
                if (create) {
                    createFilesDirectory(base_path, path, callback);
                } else {
                    fail_callback(error);
                }
            });
    }

    function createFilesDirectory(base_path, path, callback, position) {
        position = (typeof position == 'undefined') ? 0 : position;

        var path_split = path.split('/');
        var new_position = position + 1;
        var sub_path = path_split.slice(0, new_position).join('/');

        function createDirSuccess(success) {
            if (path_split.length > new_position)
                createFilesDirectory(base_path, path, callback, new_position);
            else
                callback(success);
        }

        $cordovaFile.checkDir(base_path, sub_path)
            .then(function (success) {
                createDirSuccess(success);
            }, function (error) {
                $cordovaFile.createDir(base_path, sub_path, false)
                    .then(function(success) {
                        createDirSuccess(success);
                    });
            });
    }



    return factory;
});
