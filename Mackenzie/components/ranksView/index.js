'use strict';

app.ranksView = kendo.observable({
    onShow: function() {},
    onAfterShow: function() {},
    onBeforeShow: function() {}
});


(function(parent) {    
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('ranksViewModel'),
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
            /*transport: {
                read: function(options) {
                    Everlive.$.businessLogic.invokeCloudFunction("GetRanking", {})
                        .then(function (data) {
                            options.success(data);
                        },
                        function (err) {
                            console.log('error loading ranking');
                            options.error(data);
                        });             
                }
            },*/
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },
            error: function(e) {

                if (e.xhr) {
                    app.alert(JSON.stringify(e.xhr));
                }
            },
            /*schema: {
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
            serverPaging: true,*/
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        ranksViewModel = kendo.observable({
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
            rankingsClose: function() {
                $('#appDrawer').data('kendoMobileDrawer').show();
            }
        });


    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('ranksViewModel', ranksViewModel);
        });
    } else {
        parent.set('ranksViewModel', ranksViewModel);
    }

    parent.set('onInit', function(e) {
        ranksViewModel.set('datasource', {Curso:"", ranking: [], suaPosicao: {}});
    });

    parent.set('onShow', function(e) {
        e.view.element.find('#main-header-ranking').show().siblings().hide();        
        e.view.element.find('#rankingClose').click(function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        });

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

        /*Everlive.$.businessLogic.invokeCloudFunction("GetRanking", {})
            .then(function (data) {
                ranksViewModel.set('dataSource', data);
                $('#rankingsData').show();
            },
            function (err) {
                app.alert('Error loading rankings');
            });*/

        populate(function(data) {
            ranksViewModel.set('dataSource', data);
            $('#rankingsData').show();
        });
    });

    /*parent.set('onBeforeShow', function(e) {
        $('#appDrawer').data('kendoMobileDrawer').hide();
        console.log('before show')
    });

    parent.set('onAfterShow', function(e) {
        $('#appDrawer').data('kendoMobileDrawer').hide();
        console.log('after show')
    });*/

    function populate(populateCb) {
        function getUser(index, userId, cb) {
            // INTEGRACAO DADOS MACKENZIE
            /*var queryCursos = new Everlive.Query();
            queryCursos.where().eq('Id', userId);

            var dataCursos = dataProvider.data('Users');
            dataCursos.get(queryCursos)
                .then(function(data) {
                    if (cb) {
                        try {
                            cb(index, data.result);
                        } catch(e) {
                            app.alert('Error: '+e.message);
                        }
                    }
                }, function(err) {
                    app.alert('Error loading data (Users)');
                });*/
            // INTEGRACAO DADOS MACKENZIE

            // INTEGRACAO DADOS MACKENZIE
            try {
                if (cb) {
                    cb(index, MkzDataService.getUser());
                }
            } catch(e) {
                app.alert('Error: '+e.message);
            }
            // INTEGRACAO DADOS MACKENZIE
        };      
        
        function sumarize(cb) {   
            var query = new Everlive.Query();

            query.orderDesc('Pontos');
            query.take(5);

            var data = dataProvider.data('Users');
            data.get(query)
                .then(function(data) {
                    try {
                        if (cb) {
                            cb(data.result);
                        }                        
                    } catch(err) {
                        app.alert('Sumarize Error: '+err.message);
                    } 
                },
                function(error){
                    app.alert('Error loading data (Ranking)');
                });
        } 

        function getCursos(cb) {
            // INTEGRACAO DADOS MACKENZIE
            /*var queryCursos = new Everlive.Query();
            queryCursos.where().eq('Users', app.getUserData().Id);

            var dataCursos = dataProvider.data('Cursos');
            dataCursos.get(queryCursos)
                .then(function(data) {
                    if (data.result) {
                        try {
                            cb(data.result);
                        } catch(err) {
                            app.alert('GetCursos/Ranking Error: '+err.message);
                        }
                    }
                }, function(err) {
                    app.alert('Error loading data (Cursos)');
                });*/
            // INTEGRACAO DADOS MACKENZIE

            // INTEGRACAO DADOS MACKENZIE
            try {
                cb(MkzDataService.getCursos());
            } catch(err) {
                app.alert('GetCursos/Ranking Error: '+err.message);
            }
            // INTEGRACAO DADOS MACKENZIE
        }

        function finish(data) {

            var ret = {
                    Curso: undefined,
                    suaPosicao: undefined,
                    ranking: []
                };
            
            var myId = app.getUserData().Id;
            var myData;

            getCursos(function(cursos) {
                ret.Curso = cursos[0].Nome;
            })

            for (var i=0, pushed=0; true; i++) {
                if (data.length <= i) {
                    break;
                }

                if (data[i].Id != myId) {
                    if (pushed < 5) {
                        ret.ranking.push({
                            text: (i+1)+'º',
                            fotoUri: data[i].fotoUri ? data[i].fotoUri : 'styles/images/user-male.png',
                            nome: data[i].DisplayName,
                            pontos: data[i].Pontos
                        });

                        pushed++;
                    }
                } else {
                    ret.suaPosicao = [];                    
                    ret.suaPosicao.push({
                        text: (i+1)+'º',
                        fotoUri: data[i].fotoUri ? data[i].fotoUri : 'styles/images/user-male.png',
                        nome: data[i].DisplayName,
                        pontos: data[i].Pontos
                    });
                }
            }

            try {
                if (populateCb) {
                    populateCb(ret);
                }
            } catch(err) {
                app.alert('Sumarize/Rankings Error: '+err.message);
            }
        };

        sumarize(function(data) {
            if (data) {
                for (var i=0; i < data.length; i++) {
                    data[i].Pontos = !data[i].Pontos ? 0 : data[i].Pontos;
                }

                finish(data);
            }
        });
    };


})(app.ranksView);
