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
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": {"Disciplinas": true}
                    }
                }
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
                app.displayUser();
        
                cursosViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = cursosViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel) {
                    alert('error loading disciplinas');
                    return;
                }

                if (!itemModel.Disciplinas) {
                    itemModel.Disciplinas = String.fromCharCode(160);
                }

                cursosViewModel.set('originalItem', itemModel);
                cursosViewModel.set('currentItem',
                    cursosViewModel.fixHierarchicalData(itemModel));

                var query = new Everlive.Query();
                query.where().eq('Cursos', itemModel.Id);
                query.expand({"Professor": true});

                var data = dataProvider.data('Disciplinas');
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
                    cursosViewModel.selectDiaView();
                }
            },
            initScheduler: function() {
                initScheduler();
                cursosViewModel.scheduler = $("#scheduler").data("kendoScheduler");
            },
            selectDiaView: function() {
                cursosViewModel.scheduler.view("agenda");
                //cursosViewModel.scheduler.view("day");
            },
            selectSemanaView: function() {
                cursosViewModel.scheduler.view("week");
            },
            selectMesView: function() {
                cursosViewModel.scheduler.view("month");
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
            currentItem: {},
            scheduler: undefined
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

        app.displayUser();

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
    });

    parent.set('onDetailShow', function(e) {
        app.displayUser();

        cursosViewModel.setCurrentItemByUid(e.view.params.uid);

        $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active'); //trigger('click');
        $('#disciplinas').show().siblings().hide();
        //cursosViewModel.initScheduler();
    })

})(app.cursosView);

function initScheduler() {
    var today = new Date();

    var startTime = today;
        startTime.setHours(today.getHours());
        startTime.setMinutes(today.getMinutes());
        startTime.setSeconds(0);


    $("#scheduler").kendoScheduler({
        date: today,
        startTime: startTime,
        height: 400,
        views: [
            {type: "day", allDaySlot: false, editable: false, selected: true, title: "Dia"},
            {type: "week", allDaySlot: false, editable: false, title: "Semana"},
            {type: "month", allDaySlot: false, editable: false, title: "Mes"},
            {type: "agenda", title: "Agenda"}
        ],
        //timezone: "Etc/UTC",
        dataSource: [
            {   id: 1,
                start: new Date(2016, 7, 5, 16, 0, 0, 0),
                end: new Date(2016, 7, 5, 17, 0, 0, 0),
                title: "Introdução Sistema de Computação",
                disciplina: 1 },
            {   id: 2,
                start: new Date(2016, 7, 5, 17, 0, 0, 0),
                end: new Date(2016, 7, 5, 18, 0, 0, 0),
                title: "Análise de Sistemas",
                disciplina: 2 },
            {   id: 3,
                start: new Date(2016, 7, 5, 18, 0, 0, 0),
                end: new Date(2016, 7, 5, 19, 0, 0, 0),
                title: "Filosofia Aplicada",
                disciplina: 3 },
            {   id: 4,
                start: new Date(2016, 7, 5, 19, 0, 0, 0),
                end: new Date(2016, 7, 5, 20, 0, 0, 0),
                title: "É noix mano",
                disciplina: 1 },
        ],
        resources: [
            {
                field: "disciplina",
                dataSource: [
                    { text: "Computação", value: 1, color: "#6eb3fa" },
                    { text: "Filosofia", value: 2, color: "#f58a8a" },
                    { text: "Filosofia", value: 3, color: "#00e600" }
                ],
                title: "Room"
            }
        ]
    });

        /*{
            batch: true,
            transport: {
                read: {
                    url: "//demos.telerik.com/kendo-ui/service/tasks",
                    dataType: "jsonp"
                },
                update: {
                    url: "//demos.telerik.com/kendo-ui/service/tasks/update",
                    dataType: "jsonp"
                },
                create: {
                    url: "//demos.telerik.com/kendo-ui/service/tasks/create",
                    dataType: "jsonp"
                },
                destroy: {
                    url: "//demos.telerik.com/kendo-ui/service/tasks/destroy",
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
                    id: "taskId",
                    fields: {
                        taskId: { from: "TaskID", type: "number" },
                        title: { from: "Title", defaultValue: "No title", validation: { required: true } },
                        start: { type: "date", from: "Start" },
                        end: { type: "date", from: "End" },
                        startTimezone: { from: "StartTimezone" },
                        endTimezone: { from: "EndTimezone" },
                        description: { from: "Description" },
                        recurrenceId: { from: "RecurrenceID" },
                        recurrenceRule: { from: "RecurrenceRule" },
                        recurrenceException: { from: "RecurrenceException" },
                        ownerId: { from: "OwnerID", defaultValue: 1 },
                        isAllDay: { type: "boolean", from: "IsAllDay" }
                    }
                }
            },
            filter: {
                logic: "or",
                filters: [
                    { field: "ownerId", operator: "eq", value: 1 },
                    { field: "ownerId", operator: "eq", value: 2 }
                ]
            }
        },
        resources: [
            {
                field: "ownerId",
                title: "Owner",
                dataSource: [
                    { text: "Alex", value: 1, color: "#f8a398" },
                    { text: "Bob", value: 2, color: "#51a0ed" },
                    { text: "Charlie", value: 3, color: "#56ca85" }
                ]
            }
        ]
    });*/
};


// START_CUSTOM_CODE_cursosViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_cursosViewModel