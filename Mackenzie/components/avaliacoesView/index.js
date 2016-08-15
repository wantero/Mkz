'use strict';

app.avaliacoesView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {    
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('avaliacoesViewModel'),
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

            avaliacoesViewModel.lastDisciplina = "";
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
                typeName: 'Avaliacoes',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": {
                            "Disciplina": true,
                            "Avaliacoes.Disciplina.Professor": true
                        }
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
                        'Titulo': {
                            field: 'Titulo',
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
        avaliacoesViewModel = kendo.observable({
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

                result.showDisciplina = false;
                if (avaliacoesViewModel.lastDisciplina != result.Disciplina.Id) {
                    result.showDisciplina = true;
                    avaliacoesViewModel.lastDisciplina = result.Disciplina.Id;
                }

                return result;
            },
            itemClick: function(e) {
                var dataItem = e.dataItem || avaliacoesViewModel.originalItem;

                app.mobileApp.navigate('#components/avaliacoesView/details.html?uid=' + dataItem.uid);
            },
            detailsShow: function(e) {
                app.displayUser();
        
                avaliacoesViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = avaliacoesViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel) {
                    alert('error loading disciplinas');
                    return;
                }

                if (!itemModel.Disciplinas) {
                    itemModel.Disciplinas = String.fromCharCode(160);
                }

                avaliacoesViewModel.set('originalItem', itemModel);
                avaliacoesViewModel.set('currentItem',
                    avaliacoesViewModel.fixHierarchicalData(itemModel));

                var query = new Everlive.Query();
                query.where().eq('Cursos', itemModel.Id);
                query.expand({"Professor": true});

                var data = dataProvider.data('Disciplinas');
                data.get(query)
                    .then(function(data){
                        avaliacoesViewModel.set('currentItemDisciplinas', data.result);
                    },
                    function(error){
                        alert('error loading disciplinas');
                    });        

                return itemModel;
            },
            disciplinaClick: function(e) {
                app.disciplinasView.disciplinasViewModel.set('currentDisciplina', e.dataItem);
                app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + e.dataItem.uid);
            },
            detailOption: function(e) {
                if (e.currentTarget.id === 'btDisciplinas') {
                    $('#disciplinas').show().siblings().hide();
                } else {
                    $('#agenda').show().siblings().hide();
                    avaliacoesViewModel.selectDiaView();
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
            lastDisciplina: ""
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('avaliacoesViewModel', avaliacoesViewModel);
        });
    } else {
        parent.set('avaliacoesViewModel', avaliacoesViewModel);
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

        // Armazena o parametro recebido pela VIEW
        viewParam = param;
        //fetchFilteredData(viewParam);
    });

    parent.set('onDetailShow', function(e) {
        app.displayUser();

        avaliacoesViewModel.setCurrentItemByUid(e.view.params.uid);

        $('#btDisciplinas').addClass('km-state-active').siblings().removeClass('km-state-active');
        $('#disciplinas').show().siblings().hide();
    });

})(app.avaliacoesView);
