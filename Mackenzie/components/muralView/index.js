'use strict';

app.muralView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {    
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('muralViewModel'),
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

            muralViewModel.lastDisciplina = "";
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
                    loadAvaliacoes(null, function(data) {
                        options.success(data);
                    });                    
                }
            },*/
            type: 'everlive',
            transport: {
                typeName: 'Publicacoes',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": {"User": true}
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
        muralViewModel = kendo.observable({
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

                result.TempoPublicacao = this.getTimeDiff(data.CreatedAt);

                return result;
            },
            getTimeDiff: function(datetime) {
			    var now = new Date().getTime();
			    var datetime = typeof datetime !== 'undefined' ? new Date(datetime).getTime() : new Date();

			    if (isNaN(datetime)) {
			        return "";
			    }

			    var msDiff = (datetime < now) ? now - datetime : datetime - now;

			    var days = Math.floor(msDiff / 1000 / 60 / (60 * 24));
			    var hours = Math.floor(msDiff / 1000 / 60 / 60);
			    var mins = Math.floor(msDiff / 1000 / 60);

			    var text = "agora";

			    if (days > 0) {
			    	text = hours+" hora(s) atrás";
			    } else if (hours > 0) {
			    	text = hours+" hora(s) atrás";
			    } else if (mins > 0) {
			    	mins+" minuto(s) atrás";
			    }

			    return text;
			},/*
            itemClick: function(e) {
                var item = e.button.parents('li').attr('data-uid');
                var dataItem = dataSource.getByUid(item); // || muralViewModel.originalItem;

                muralViewModel.setCurrentItemByUid(dataItem.uid);

                muralViewModel.loadQuestoesAvaliacao(dataItem.Id, function(questoes) {
                    muralViewModel.set('currentItemQuestoes', questoes);
                    app.mobileApp.navigate('#components/muralView/details.html?uid=' + dataItem.uid);
                });
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = muralViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel) {
                    alert('Error loading data (Avaliacoes)');
                    return;
                }

                muralViewModel.set('originalItem', itemModel);

                itemModel.Flow = 'avaliacoes';                    
                muralViewModel.set('currentItem',
                    muralViewModel.fixHierarchicalData(itemModel));


                return itemModel;
            },*/
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
            parent.set('muralViewModel', muralViewModel);
        });
    } else {
        parent.set('muralViewModel', muralViewModel);
    }

    
    parent.set('onShow', function(e) {
    	if (e.view.params.tipo && e.view.params.tipo == 'minhaspub') {
	        e.view.element.find('#header-minhas-publicacoes').show().siblings().hide();        
	        e.view.element.find('#muralPublicacoesClose').click(function() {
	            $('#appDrawer').data('kendoMobileDrawer').show();
	        });
    	} else {
	        e.view.element.find('#header-mural-publicacoes').show().siblings().hide();        
    	}

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

        /*loadAvaliacoes(null, function(data) {
            muralViewModel.set('dataSource', data);
        });*/

        // Armazena o parametro recebido pela VIEW
        viewParam = param;

        fetchFilteredData(viewParam);
    });

})(app.muralView);
