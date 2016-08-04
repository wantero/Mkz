'use strict';

app.cursosView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_cursosView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_cursosView
(function(parent) {    
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('cursosViewModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        processImage = function(img) {

            function isAbsolute(img) {
                if  (img && (img.slice(0,  5)  ===  'http:' || img.slice(0,  6)  ===  'https:' || img.slice(0,  2)  ===  '//'  ||  img.slice(0,  5)  ===  'data:')) {
                    return true;
                }
                return false;
            }

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (!isAbsolute(img)) {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },
        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'Cursos',
                dataProvider: dataProvider
            },
            filterable: true,
            filters: [{ field: "Id", operator: "eq", value: "1" }],
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },
            error: function(e) {

                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'Curso': {
                            field: 'Curso',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        cursosViewModel = kendo.observable({
            dataSource: dataSource,
            fixHierarchicalData: function(data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function(e) {
                var dataItem = e.dataItem || cursosViewModel.originalItem;

                app.mobileApp.navigate('#components/cursosView/details.html?uid=' + dataItem.uid);
                /*app.mobileApp.navigate('components/disciplinasView/view.html?filter=' + encodeURIComponent(JSON.stringify({
                    field: 'Cursos',
                    value: dataItem.Id,
                    operator: 'eq'
                })));*/

            },
            detailsShow: function(e) {
                cursosViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = cursosViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                console.log('itemModel', itemModel);

                if (!itemModel.Disciplinas) {
                    itemModel.Disciplinas = String.fromCharCode(160);
                }

                cursosViewModel.set('originalItem', itemModel);
                cursosViewModel.set('currentItem',
                    cursosViewModel.fixHierarchicalData(itemModel));

                var query = new Everlive.Query();
                query.where().eq('Cursos', itemModel.Id);

                var data = app.data.mackenzie.data('Disciplinas');
                data.get(query)
                    .then(function(data){
                        cursosViewModel.set('currentItemDisciplinas', data.result);
                    },
                    function(error){
                        alert('error loading disciplinas');
                    });        

                return itemModel;
            },
            disciplinaClick: function(e) {
                //app.disciplinasView.disciplinasViewModel.itemClick(e);
                //var dataItem = e.dataItem || cursosViewModel.originalItem;
                cursosViewModel.set('currentDisciplina', e.dataItem);
                app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + e.dataItem.uid);
            },
            detailOption: function(e) {
                if (e.currentTarget.id === 'btDisciplinas') {
                    $('#disciplinas').show().siblings().hide();
                } else {
                    $('#agenda').show().siblings().hide();
                }
            },
            linkBind: function(linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function(imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            filtraPesquisa: function(valueField) {
                if (viewParam === null) {
                    var param = [{ field: "Curso", operator: "contains", value: valueField }];
                } else {
                    var param = [viewParam, { field: "Curso", operator: "contains", value: valueField }];
                }        

                fetchFilteredData(param);
            },
            initScheduler: function() {
                /*$("#scheduler").kendoScheduler({
                    date: new Date("2013/6/26"),
                    startTime: new Date("2013/6/26 07:00 AM"),
                    height: 'auto',
                    views: [
                        { type: "day", selected: true },
                        { type: "week", selectedDateFormat: "{0:ddd,MMM dd,yyyy} - {1:ddd,MMM dd,yyyy}" },
                        "month",
                        { type: "agenda", selectedDateFormat: "{0:ddd, M/dd/yyyy} - {1:ddd, M/dd/yyyy}" },
                        "timeline"
                    ],
                    mobile: "phone",
                    timezone: "Etc/UTC",
                    dataSource: {
                        batch: true,
                        transport: {
                            read: {
                                url: "//demos.telerik.com/kendo-ui/service/meetings",
                                dataType: "jsonp"
                            },
                            update: {
                                url: "//demos.telerik.com/kendo-ui/service/meetings/update",
                                dataType: "jsonp"
                            },
                            create: {
                                url: "//demos.telerik.com/kendo-ui/service/meetings/create",
                                dataType: "jsonp"
                            },
                            destroy: {
                                url: "//demos.telerik.com/kendo-ui/service/meetings/destroy",
                                dataType: "jsonp"
                            },
                            parameterMap: function(options, operation) {
                                if (operation !== "read" && options.models) {
                                    return {models: kendo.stringify(options.models)};
                                }
                            }
                        },
                        schema: {
                            model: {
                                id: "meetingID",
                                fields: {
                                    meetingID: { from: "MeetingID", type: "number" },
                                    title: { from: "Title", defaultValue: "No title", validation: { required: true } },
                                    start: { type: "date", from: "Start" },
                                    end: { type: "date", from: "End" },
                                    startTimezone: { from: "StartTimezone" },
                                    endTimezone: { from: "EndTimezone" },
                                    description: { from: "Description" },
                                    recurrenceId: { from: "RecurrenceID" },
                                    recurrenceRule: { from: "RecurrenceRule" },
                                    recurrenceException: { from: "RecurrenceException" },
                                    roomId: { from: "RoomID", nullable: true },
                                    attendees: { from: "Attendees",  defaultValue: [] },
                                    isAllDay: { type: "boolean", from: "IsAllDay" }
                                }
                            }
                        }
                    },
                    resources: [
                    {
                        field: "roomId",
                        dataSource: [
                            { text: "Meeting Room 101", value: 1, color: "#6eb3fa" },
                            { text: "Meeting Room 201", value: 2, color: "#f58a8a" }
                        ],
                        title: "Room"
                    },
                    {
                        field: "attendees",
                        dataSource: [
                            { text: "Alex", value: 1, color: "#f8a398" },
                            { text: "Bob", value: 2, color: "#51a0ed" },
                            { text: "Charlie", value: 3, color: "#56ca85" }
                        ],
                        multiple: true,
                        title: "Attendees"
                    }
                    ]
                });*/
            },
            currentItem: {}
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('cursosViewModel', cursosViewModel);
        });
    } else {
        parent.set('cursosViewModel', cursosViewModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        dataProvider.Users.currentUser().then(
            function(user) {
                // Fixa o filtro do usuário logado
                param = [{ field: "Users", operator: "eq", value: user.result.Id }];

                // Armazena o parametro recebido pela VIEW
                viewParam = param;     

                fetchFilteredData(viewParam);
            },
            function() {
                console.log('erro ao carregar usuario corrente')
            }
        );

        cursosViewModel.initScheduler();
    });

    parent.set('onDetailShow', function(e) {
        $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active'); //trigger('click');
        $('#disciplinas').show().siblings().hide();
    })

})(app.cursosView);

// START_CUSTOM_CODE_cursosViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_cursosViewModel