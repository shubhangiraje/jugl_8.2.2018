app.controller('ContactsCtrl', function ($q,$rootScope,$scope,userNameFilter,$timeout,messengerService,$cordovaActionSheet,jsonPostDataPromise,jsonDataPromise,gettextCatalog,$interval) {

    var self=this;

    var dataSourceData=null;
    var shortnames_country={
            64:'de',
            10:'at',
            170:'ch',
            1:'af',
            2:'al',
            3:'dz',
            4:'ad',
            5:'ao',
            6:'ag',
            7:'ar',
            8:'am',
            9:'au',
            11:'az',
            12:'bs',
            13:'bh',
            14:'bd',
            15:'bb',
            16:'by',
            17:'be',
            18:'bz',
            19:'bj',
            20:'bm',
            21:'bo',
            22:'ba',
            23:'bw',
            24:'br',
            25:'bn',
            26:'bg',
            27:'bf',
            28:'bi',
            29:'kh',
            30:'cm',
            31:'ca',
            32:'cv',
            33:'cf',
            34:'td',
            35:'cl',
            36:'cn',
            37:'co',
            38:'km',
            39:'cg',
            40:'cd',
            41:'cr',
            42:'hr',
            43:'cu',
            44:'cy',
            45:'cz',
            46:'dk',
            47:'dj',
            48:'dm',
            49:'do',
            50:'tl',
            51:'ec',
            52:'eg',
            53:'sv',
            54:'gq',
            55:'er',
            56:'ee',
            57:'et',
            58:'fj',
            59:'fi',
            60:'fr',
            61:'ga',
            62:'gm',
            63:'ge',
            65:'gh',
            66:'gr',
            67:'gd',
            68:'gt',
            69:'gn',
            70:'gw',
            71:'gy',
            72:'ht',
            73:'hn',
            74:'hu',
            75:'is',
            76:'in',
            77:'id',
            78:'ir',
            79:'iq',
            80:'ie',
            81:'il',
            82:'it',
            83:'ci',
            84:'jm',
            85:'jp',
            86:'jo',
            87:'kz',
            88:'ke',
            89:'ki',
            90:'kp',
            91:'kr',
            92:'ko',
            93:'kw',
            94:'kg',
            95:'la',
            96:'lv',
            97:'lb',
            98:'ls',
            99:'lr',
            100:'ly',
            101:'li',
            102:'lt',
            103:'lu',
            104:'mk',
            105:'mg',
            106:'mw',
            107:'my',
            108:'mv',
            109:'ml',
            110:'mt',
            111:'mh',
            112:'mr',
            113:'mu',
            114:'mx',
            115:'fm',
            116:'md',
            117:'mc',
            118:'mn',
            119:'me',
            120:'ma',
            121:'mz',
            122:'mm',
            123:'na',
            124:'nr',
            125:'np',
            126:'nl',
            127:'nz',
            128:'ni',
            129:'ne',
            130:'ng',
            131:'no',
            132:'om',
            133:'pk',
            134:'pl',
            135:'pa',
            136:'pg',
            137:'py',
            138:'pe',
            139:'ph',
            140:'pl',
            141:'pt',
            142:'qa',
            143:'ro',
            144:'ru',
            145:'rw',
            146:'kn',
            147:'lc',
            148:'vc',
            149:'ws',
            150:'sm',
            151:'st',
            152:'sa',
            153:'sn',
            154:'rs',
            155:'sc',
            156:'sl',
            157:'sg',
            158:'sk',
            159:'si',
            160:'sb',
            161:'so',
            162:'za',
            163:'ss',
            164:'es',
            165:'lk',
            166:'sd',
            167:'sr',
            168:'sz',
            169:'se',
            171:'sy',
            172:'tw',
            173:'tj',
            174:'tz',
            175:'th',
            176:'tg',
            177:'to',
            178:'tt',
            179:'tn',
            180:'tr',
            181:'tm',
            182:'tv',
            183:'ug',
            184:'ua',
            185:'ae',
            186:'gb',
            187:'us',
            188:'uy',
            189:'uz',
            190:'vu',
            191:'va',
            192:'ve',
            193:'vn',
            194:'ye',
            195:'zm',
            196:'zw'
	};

    function getContactsData() {
        var data = [];
        for (var i in messengerService.users) {
            var user = messengerService.users[i];

            if (($scope.data.displayContacts=='chats' && user.id>0) || ($scope.data.displayContacts=='forumChats' && user.id<0)) {
                var userData = {
                    id: user.id,
                    dt: $scope.lastMessages[user.id] ? $scope.lastMessages[user.id].dt:'',
                    userName: user.first_name + ' ' + user.last_name,
                    userAvatar: user.avatar_mobile_url,
                    unreadedMessages: user.unreaded_messages,
                    is_group_chat: user.is_group_chat,
                    flag : shortnames_country[user.country_id]
                };

                userData.letter = user.first_name.substr(0, 1).toUpperCase();
                data.push(userData);
            }
        }

        $scope.data.cntr++;

        return data;
    }

    function msgSortFunc(msg1,msg2) {
        if ($scope.data.grouped && msg1.letter!=msg2.letter) {
            return msg1.letter<msg2.letter ? -1:1;
        }

        if (msg1.dt!=msg2.dt) {
            return msg1.dt>msg2.dt ? -1:1;
        }

        if (msg1.userName!=msg2.userName) {
            return msg1.userName<msg2.userName ? -1:1;
        }

        return 0;
    }

    function syncronizeDataSourceData() {
        //var st=(new Date()).getTime();
        //console.log('contactlist sync start =====');

        if (dataSourceData===null) {
            //console.log('old data not initialized, skip');
            return;
        }

        var data=getContactsData();

        var forceFullRefresh=dataSourceData.length!=data.length;
        var forceCheckReorder=false;

        if (!forceFullRefresh) {
            for(var newIdx in dataSourceData) {
                var oldObj=dataSourceData[newIdx];
                var newObj=data[newIdx];

                if (oldObj.id!=newObj.id) {
                    forceFullRefresh=true;
                    break;
                }

                if (oldObj.dt!=newObj.dt ||
                    oldObj.userName!=newObj.userName ||
                    oldObj.userAvatar!=newObj.userAvatar ||
                    oldObj.unreadedMessages!=newObj.unreadedMessages
                ) {
                    var model=$scope.data.listViewOptions.dataSource.get(newObj.id);
                    model.set('dt',newObj.dt);
                    model.set('userName',newObj.userName);
                    model.set('userAvatar',newObj.userAvatar);
                    model.set('unreadedMessages',newObj.unreadedMessages);
                    if (oldObj.dt!=newObj.dt ||
                        oldObj.userName!=newObj.userName) {
                        forceCheckReorder=true;
                    }

                }
            }
        }

        if (forceCheckReorder) {
            //console.log('force check reorder');
            newOrder=data.slice().sort(msgSortFunc);
            oldOrder=dataSourceData.sort(msgSortFunc);
            for(var cmpIdx in newOrder) {
                if (newOrder[cmpIdx].id!=oldOrder[cmpIdx].id) {
                    forceFullRefresh=true;
                    //console.log('reorder is needed');
                    break;
                }
            }
        }

        if (forceFullRefresh) {
            //console.log('force full refresh');
            $scope.data.listViewOptions.dataSource.read();
        }

        dataSourceData=data;

        //var et=(new Date()).getTime();

        //console.log('contactlist sync finished in '+(et-st)+' ms ======');
    }
/*
    function exchangeModelsField(model1,model2,field) {
        var tmp=model1.get(field);
        model1.set(field,model2.get(field));
        model2.set(field,tmp);
    }

    function exchangeModels(model1,model2) {
        exchangeModelsField(model1,model2,'id');
        exchangeModelsField(model1,model2,'dt');
        exchangeModelsField(model1,model2,'userName');
        exchangeModelsField(model1,model2,'userAvatar');
        exchangeModelsField(model1,model2,'unreadedMessages');
    }
*/
    if (!$scope.data) {

        var prevReadOptions;

        $scope.data={
            cntr: 0,
            grouped: false,
            listViewOptions: {
                template: $('#template-contacts-item').html(),
                dataSource: new kendo.data.DataSource({
                    transport: {
                        read: function(options) {
                            //console.log('read called');
                            //console.log(options);

                            if (options.data.filter) {
                                //if (prevReadOptions) {
                                //    console.log('cancel prev read options');
                                //    prevReadOptions.timeout.resolve();
                                //    prevReadOptions.error(null);
                                //}
                                //options.timeout=$q.defer();
                                //prevReadOptions=options;
                                jsonDataPromise('/ext-api-user-search/search-by-name',{name:options.data.filter.filters[0].value}/*,options.timeout.promise*/).then(
                                    function(data) {
                                        for(var idx in data.items) {
                                            var item=data.items[idx];
                                            item.userAvatar=item.avatar_mobile_url;
                                            item.letter=item.userName.substr(0, 1).toUpperCase();
                                        }
                                        options.success(data.items);
                                        //prevReadOptions=null;
                                    },
                                    function(error) {
                                        options.error(error);
                                        //prevReadOptions=null;
                                    }
                                );
                            } else {
                                var data=getContactsData();
                                $timeout(function(){options.success(data);dataSourceData=data;});
                            }
                        },
                        create: function(options) {
                            //console.log('create called');
                            //console.log(options);
                        }
                    },
                    data: [],
                    sort: [
                        {field: "dt", dir: "desc" },
                        {field: "userName", dir: "asc" }
                    ],
                    group: [],
                    serverFiltering: true
                }),
                filterable: {
                    field: "userName",
                    operator: "contains",
                    placeholder: gettextCatalog.getString("Mitglieder suchen..."),
                    ignoreCase: true
                },
                fixedHeaders: true
            }
        };

        var displayContactsTypes={
            0: 'chats',
            1: 'forumChats'
        };
        $scope.data.displayContacts='chats';
        $scope.data.displayContactsOptions={
            select: function(e) {
                $scope.data.displayContacts=displayContactsTypes[e.index];
                syncronizeDataSourceData();
                $scope.$apply();
            },
            index: 0
        };

        $scope.data.contactPopup=function(id) {
            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Aktionen'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Chat löschen'),
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                switch(btnIndex) {
                    case 1:
                        kendo.mobile.application.showLoading();
                        jsonPostDataPromise('/ext-api-user-profile/delete-contact-history',{userId:id}).then(function() {
                            kendo.mobile.application.hideLoading();
                            messengerService.deleteContactHistory(id);
                        },function(){
                            kendo.mobile.application.hideLoading();
                        });

                        break;
                }
            });
        };

        $scope.data.isCurrent=false;

        $scope.data.onShow=function(event) {
            $scope.data.unwatch=$rootScope.$watch('messenger.conversations',function(){
                $rootScope.lastMessages={};
                for(var i in messengerService.conversations) {
                    $rootScope.lastMessages[messengerService.conversations[i].user_id]=messengerService.conversations[i].message;
                }
                syncronizeDataSourceData();
                //$scope.data.listViewOptions.dataSource.read();
            },true);

            $scope.data.isCurrent=true;
        };

        $scope.data.onHide=function(event) {
            $scope.data.unwatch();
            $scope.data.isCurrent=false;
        };

        $scope.data.toggleGrouped=function() {
            $scope.data.grouped=!$scope.data.grouped;
            if ($scope.data.grouped) {
                $scope.data.listViewOptions.dataSource.group([{field:'letter'}]);
            } else {
                $scope.data.listViewOptions.dataSource.group([]);
                $('#view-contacts .km-scroll-header').html('');
            }
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
        };

/*
        $scope.$watch('messenger.users',function(newVal,oldVal) {
            syncronizeDataSourceData();
        });
        */

/*
        $interval(function() {

            //model.set('unreadedMessages',model.get('unreadedMessages') ? model.get('unreadedMessages')+1:1);
            //model.set('dt','2018-01-11T12:46:00.000Z');
            //$scope.data.listViewOptions.dataSource.sort($scope.data.listViewOptions.dataSource.sort());
            console.log('inserted');
        },1000);
*/
    }
});
