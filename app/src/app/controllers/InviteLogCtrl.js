app.controller('InviteLogCtrl', function ($scope,jsonDataPromise,status,jsonPostDataPromise,$cordovaSpinnerDialog,$cordovaSms,modal,dateFilter,gettextCatalog) {

    if (!$scope.data) {

        var statusFilter={
            0:'OPEN',
            1:'CLICKED',
            2:'REGISTERED'
        };

        $scope.data={
            listViewOptions: {
                template: $('#template-funds-item').html(),
                headerTemplate: function(data) {
                    return data.value.replace(/^.*\|/,'');
                },
                dataSource: new kendo.data.DataSource({
                    data: [],
                    sort: [
                        {field: "dt", dir: "desc" }
                    ],
                    group: [{field:'group',dir:'desc'}]
                })
            },
            log: {
                filter:{
                    status: 0
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            },
            statusFilterOptions: {
                select: function(e) {
                    $scope.data.log.filter.status=e.index;
                    $scope.$apply();
                },
                index: 0
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            status.update();
            $scope.data.log.refresh();
        };

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.grouped=[];
                $scope.data.listViewOptions.dataSource.data([]);
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.log.refresh=function() {
            $scope.data.log.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.log.load();
        };

        $scope.data.log.loadMore=function() {
            var data=$scope.data.log;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.resend = function(item) {
            $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Contacting server',true));

            jsonPostDataPromise('/ext-api-invitation/resend-invitation',{invitationId:item.id})
                .then(function(data){
                    $cordovaSpinnerDialog.hide();

                    if (item.type=='SMS' && data.message===true) {
                        $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'), gettextCatalog.getString('Sending SMS'),true);

                        var options = {
                            replaceLineBreaks: false, // true to replace \n by a new line, false by default
                            android: {
                                //intent: 'INTENT'  // send SMS with the native android SMS messaging
                                intent: '' // send SMS without open any other app
                            }
                        };

                        var link = data.invitation.link;
                        var text = data.invitation.text + ' ' + link;

                        $cordovaSms.send(item.address, text, options)
                            .then(function(){
                                $cordovaSpinnerDialog.hide();
                                modal.alert(gettextCatalog.getString('Einladung wurde erfolgreich erneut versendet.'));
                            }, function(err){
                                modal.error(err);
                                $cordovaSpinnerDialog.hide();
                            });
                    } else {
                        modal.alert(data.message);
                    }
                },function(){
                    $cordovaSpinnerDialog.hide();
                });

        };


        $scope.data.delete = function(invitationId) {

            modal.confirmYesCancel(gettextCatalog.getString('Möchtest du die Einladung löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-invitation/delete-invitation', {invitationId: invitationId})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result===true) {
                            for (var idx in $scope.data.log.grouped) {
                                for(var idxs in $scope.data.log.grouped[idx].items) {
                                    if ($scope.data.log.grouped[idx].items[idxs].id == invitationId) {
                                        $scope.data.log.grouped[idx].items.splice(idxs, 1);
                                    }
                                }
                            }
                        }
                    });
            });
        };


        $scope.data.log.load = function() {
            var data=$scope.data.log;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-invitation/log', {
                status: statusFilter[data.filter.status],
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    data.grouped=[];

                    for(var i in data.items) {
                        var dt=dateFilter(data.items[i].dt,'dd.MM.yyyy');
                        data.items[i].group=data.items[i].dt+'|'+dt;
                        if (data.grouped.length===0 || data.grouped[data.grouped.length-1].dt!=dt) {
                            data.grouped.push({dt:dt,items:[]});
                        }

                        data.grouped[data.grouped.length-1].items.push(data.items[i]);
                    }

                    $scope.data.listViewOptions.dataSource.data(data.items);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };




    }
});
