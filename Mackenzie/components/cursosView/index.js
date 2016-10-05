'use strict';

app.cursosView = kendo.observable({
    onShow: function() {},
    beforeShow: function() {},
    afterShow: function() {}
});

alert('loading...');

(function(parent) {    
    var state = "";
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

                /*if (cursosViewModel.scheduler) {
                    cursosViewModel.scheduler.destroy();
                    $("#scheduler").html("");
                    cursosViewModel.scheduler = undefined;
                }

                cursosViewModel.filterScheduler();*/
                app.mobileApp.navigate('#components/cursosView/details.html?uid=' + dataItem.uid);
            },
            viewBackClick: function(e) {
                app.mobileApp.navigate('#components/cursosView/view.html');
            },
            /*detailsShow: function(e) {
                app.displayUser();
        
                cursosViewModel.setCurrentItemByUid(e.view.params.uid);
            },*/
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = cursosViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                cursosViewModel.setCurrentItemById(itemModel);
            },
            setCurrentItemById: function(itemModel) {
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
                var data = e.dataItem;
                app.disciplinasView.disciplinasViewModel.set('currentDisciplina', data);

                if (data.Professor.Unidade == '') {
                    data.Professor.Unidade = '?';
                }

                if (data.Professor.Turma == '') {
                    data.Professor.Turma = '?';
                }

                if (data.Professor.Sala == '') {
                    data.Professor.Sala = '?';
                }

                app.cursosView.cursosViewModel.loadPublicacoes(e.dataItem.Id, function(publicacoes) {
                    app.disciplinasView.disciplinasViewModel.set('publicacoes', publicacoes);
                    
                    app.disciplinasView.disciplinasViewModel.set('publicacoesCount', 
                        { doc: publicacoes.docCount,
                          video: publicacoes.videoCount,
                          image: publicacoes.imageCount,
                          msg: publicacoes.msgCount });                    

                    $('#tabAvaliacoes #docsCount').text(publicacoes.docCount);
                    $('#tabAvaliacoes #videosCount').text(publicacoes.videoCount);
                    $('#tabAvaliacoes #imagesCount').text(publicacoes.imageCount);
                    $('#tabAvaliacoes #msgsCount').text(publicacoes.msgCount);

                    app.avaliacoesView.avaliacoesViewModel.loadAvaliacoes(e.dataItem.Id, function(data) {
                        app.disciplinasView.disciplinasViewModel.set('avaliacoes', data);
                        app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + e.dataItem.uid);
                    });
                });
            },
            avaliacoesBack: function(e) {
                var dataItem = app.disciplinasView.disciplinasViewModel.get('currentDisciplina');

                app.avaliacoesView.avaliacoesViewModel.loadAvaliacoes(dataItem.Id, function(data) {
                    app.disciplinasView.disciplinasViewModel.set('avaliacoes', data);
                    history.go(-2);
                    //app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + dataItem.uid);
                });
            },
            detailOption: function(e) {
                if (cursosViewModel.state != 'finished') {
                    return;
                }

                if (e.currentTarget.id === 'btDisciplinas') {
                    $('#tabCursoDisciplinas').show().siblings().hide();
                    $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active');
                } else {
                    $('#tabCursoAgenda').show().siblings().hide();
                    $('#btAgenda').addClass('km-state-active').siblings().removeClass('km-state-active');
                    cursosViewModel.selectDiaView();
                }
            },
            selectSchedulerFromMenu: function() {
                app.mobileApp.navigate('#components/cursosView/details.html?from=menu');
            },
            loadPublicacoes: function(disciplinaId, done) {
                var query = new Everlive.Query();
                query.where().eq('Disciplina', disciplinaId);
                query.expand({
                    "User": true,
                    "Comentarios": true,
                    "CompartilhadoDe": true,
                    "CompartilhadoDeUser": true
                });
                query.orderDesc('CreatedAt');
                //query.order('Ordem');

                var data = dataProvider.data('Publicacoes');
                data.get(query)
                    .then(function(data) {
                        var publicacoes = data.result;
                        
                        publicacoes.imageCount = 0;
                        publicacoes.videoCount = 0;
                        publicacoes.docCount = 0;
                        publicacoes.msgCount = 0;

                        for (var i=0; i < publicacoes.length; i++) {
                            if (publicacoes[i].Tipo == 'image') {
                                publicacoes.imageCount++;
                            } else if (publicacoes[i].Tipo == 'video') {
                                publicacoes.videoCount++;
                            } else if (publicacoes[i].Tipo == 'doc') {
                                publicacoes.docCount++;
                            } else if (publicacoes[i].Tipo == 'msg') {
                                publicacoes.msgCount++;
                            }
                        }

                        try {
                            done(publicacoes);    
                        } catch(err) {
                            alert('LoadPublicacoes Error: '+err.message);
                        }                        
                    },
                    function(error){
                        alert('Error loading data (Questoes)');
                    });
            },
            filterScheduler: function(cb) {
                if (!cursosViewModel.scheduler) {
                    cursosViewModel.initScheduler(cb);
                    return;
                }

                function dayOfWeek(date) {
                    var week = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                    return week[date.getDay()];
                }

                var dayOfWeek = dayOfWeek(new Date());

                try {
                    var currentItem = cursosViewModel.get('currentItem');
                    var cursoId = currentItem.Id;
                    //var cursoId = app.cursosView.cursosViewModel.dataSource.data()[0].Id;
                    var query = new Everlive.Query();

                    query.where().eq('Curso', cursoId);
                    //query.where().eq('Dia', dayOfWeek);
                    query.expand({"Disciplina": true});

                    var data = dataProvider.data('GradeHorario');
                    data.get(query)
                        .then(function(data){
                            try {
                                var today = new Date();
                                var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
                                var dataScheduler = [];

                                data.result.forEach(function(cur, index, arr) {

                                    function dayOfWeek(date) {
                                        var week = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                                        return week[date.getDay()];
                                    }

                                    for (var dia = 1; dia <= lastDayOfMonth; dia++) {
                                        var calcDate = new Date(today.getFullYear(), today.getMonth(), dia);

                                        if (dayOfWeek(calcDate) == cur.dia) {
                                            var item = {};

                                            item.start = new Date(cur.HorarioInicio);
                                            item.start.setDate(calcDate.getDate());
                                            item.start.setMonth(calcDate.getMonth());
                                            item.start.setFullYear(calcDate.getFullYear());

                                            item.end = new Date(cur.HorarioFim);
                                            item.end.setDate(calcDate.getDate());
                                            item.end.setMonth(calcDate.getMonth());
                                            item.end.setFullYear(calcDate.getFullYear());

                                            item.title = cur.Disciplina.Nome;
                                            item.disciplinaColor = cur.Disciplina.Id;
                                            item.colorId = cur.Disciplina.Id;

                                            dataScheduler.push(item);
                                        }
                                    }
                                });

                           // $('#scheduler').hide();
                                var dataSourceScheduler = new kendo.data.SchedulerDataSource({
                                    data: dataScheduler //data.result
                                });


                                cursosViewModel.scheduler.setDataSource(dataSourceScheduler);
                            //$('#scheduler').show();

                                if (cb) {
                                    try {
                                        cb();
                                    } catch(err) {
                                        alert('FilterScheduler Error: '+err.message);
                                    }
                                }
                            } catch(e) {
                                alert(e.message);
                            }
                        },
                        function(error){
                            alert('error loading disciplinas');
                        });    
                } catch(e) {
                    alert("Falha ao carregar grade de horário.");
                }
            },
            initScheduler: function(cb) {
                var today = new Date();

                var startTime = today;
                    startTime.setHours(today.getHours());
                    startTime.setMinutes(today.getMinutes());
                    startTime.setSeconds(0);

                var resourceList = []; //{field: "colorId", title: "Disciplina", dataSource: []};

                var currentItem = cursosViewModel.get('currentItem');
                var cursoId = currentItem.Id;
                //var cursoId = app.cursosView.cursosViewModel.dataSource.data()[0].Id;

                var query = new Everlive.Query();
                query.where().eq('Cursos', cursoId);

                try {
                    var data = dataProvider.data('Disciplinas');
                    data.get(query)
                        .then(function(data) {
                            data.result.forEach(function(cur, index, arr) {
                                resourceList.push({
                                    text: cur.Nome,
                                    value: cur.Id,
                                    color: cur.color
                                });
                            });

                            $("#scheduler").kendoScheduler({
                                date: today,
                                startTime: startTime,
                                height: 400,
                                mobile: true,
                                timezone: "Etc/UTC",
                                messages: {
                                    today: "Hoje",
                                    time: "Horário",
                                    event: "Disciplina",
                                    date: "Dia"
                                },
                                views: [
                                    {type: "day", allDaySlot: false, editable: false, selected: true, title: "Dia"},
                                    {type: "week", allDaySlot: false, editable: false, title: "Semana"},
                                    {type: "month", allDaySlot: false, editable: false, title: "Mes"},
                                    {type: "agenda", title: "Agenda"}
                                ],
                                resources: [
                                    {
                                        field: "colorId",
                                        dataSource: resourceList,
                                        title: "Disciplina"
                                    }
                                ]
                            });

                            cursosViewModel.scheduler = $("#scheduler").data("kendoScheduler");
                            cursosViewModel.filterScheduler(cb);
                        },
                        function(error){
                            alert('error loading disciplinas');
                        }); 
                } catch(e) {
                    alert(e.message);
                }
            },
            selectDiaView: function() {
                if (cursosViewModel.scheduler) {
                    cursosViewModel.scheduler.view("agenda");
                }
            },
            selectSemanaView: function() {
                if (cursosViewModel.scheduler) {
                    cursosViewModel.scheduler.view("week");
                }
            },
            selectMesView: function() {
                if (cursosViewModel.scheduler) {
                    cursosViewModel.scheduler.view("month");
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

    parent.set('onBeforeShow', function(e) {
        alert('before show');
    });

    parent.set('onShow', function(e) {
        alert('on show');
        
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
        cursosViewModel.state = 'loading';

        if (e.view.params.from && e.view.params.from == 'menu') {
                    cursosViewModel.selectDiaView();                    
            $('#btAgenda').addClass('km-state-active').siblings().removeClass('km-state-active');
            $('#tabCursoAgenda').show().siblings().hide();


            function getCursos(cb) {
                var queryCursos = new Everlive.Query();
                queryCursos.where().eq('Users', app.getUserData().Id);

                var dataCursos = dataProvider.data('Cursos');
                dataCursos.get(queryCursos)
                    .then(function(data) {
                        var cursos = [];
                        for (var i=0; i < data.result.length; i++) {
                            cursos.push(data.result[i]);
                        }

                        try {
                            cb(cursos);    
                        } catch(err) {
                            alert('Crusor.onDetailShow/GetCursos Error: '+err.message);
                        }                        
                    }, function(err) {
                        alert('Error loading data (Cursos)');
                    });
            }

            getCursos(function(cursos) {
                cursosViewModel.setCurrentItemById(cursos[0]);  

                /*if (cursosViewModel.scheduler) {
                    cursosViewModel.scheduler.destroy();
                    $("#scheduler").html("");
                    cursosViewModel.scheduler = undefined;
                }*/

                cursosViewModel.filterScheduler(function() {
                    //cursosViewModel.selectDiaView();  
                    cursosViewModel.state = 'finished';
                });
            });
        } else {
            $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active');
            $('#tabCursoDisciplinas').show().siblings().hide();

            cursosViewModel.filterScheduler(function() {
                cursosViewModel.setCurrentItemByUid(e.view.params.uid);

                $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active');
                $('#tabCursoDisciplinas').show().siblings().hide();
                
                cursosViewModel.state = 'finished';
            });
        }
    });

})(app.cursosView);