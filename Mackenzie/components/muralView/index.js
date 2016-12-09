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
            type: 'everlive',
            transport: {
                typeName: 'Publicacoes',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": {
                            "User": {
                                "TargetTypeName": "Users"
                            },
                            "Comentarios": {
                                "TargetTypeName": "PublicacoesComentarios"
                            },
                            "CompartilhadoDe": {
                                "TargetTypeName": "Publicacoes"
                            },
                            "CompartilhadoDeUser": {
                                "TargetTypeName": "Users"
                            }
                        }
                    }
                }
            },
            requestEnd: function(e) {
                app.mobileApp.hideLoading();
                $('#appDrawer').data('kendoMobileDrawer').hide();
            },
            change: function(e) {
                var data = this.data();

                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },
            error: function(e) {
                app.mobileApp.hideLoading();

                if (dataProvider.isOffline()) {
                    return true;
                }
                
                if (e.xhr) {
                    app.alert(JSON.stringify(e.xhr));
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
            sort: [{ field: "CreatedAt", dir: "desc" }],
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        muralViewModel = kendo.observable({
            dataSource: dataSource,
            disciplinas: undefined,
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

                result.TempoPublicacao = this.getTempoDecorrido(data.CreatedAt);
                result.AlreadyLike = PublicacoesService.findLike(data.Likes, app.getUserData().Id);
                result.LoggedUser = app.getUserData().Id;

                for (var i = 0, len = muralViewModel.disciplinas.length; i < len; i++) {
                    if (result.Disciplina == muralViewModel.disciplinas[i].Id) {
                        result.DisciplinaNome = muralViewModel.disciplinas[i].Nome;
                        break;
                    }
                }

                if (result.CompartilhadoDe) {
                    if (typeof result.CompartilhadoDe === 'object') {
                        result.CompartilhadoDe.TempoPublicacao = this.getTempoDecorrido(data.CompartilhadoDe.CreatedAt);
                    }
                }

                return result;
            },
            muralPublicacaoReply: function(e) {
                var pub = e.context.pub;
                var ele = e.context.view;
                var dataProvider = app.data.mackenzie;
                var dataSource = e.context.dataSource;

                PublicacoesService.createPublicacao(dataProvider, pub.Tipo, null, null, null, null, null, pub.Disciplina, pub, function(pubAdd) {
                    dataSource.add(pubAdd);
                    var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                    connectMuralEvents(newEl);
                });
            },
            muralPublicacaoEditBeforeReply: function(e) {
                var pub = e.context;
                var updateMural = e.target.closest('ul').parent().closest('ul').find('#reply-mural-publicacoes');

                var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
                var tituloPub = updateMural.find('#tituloCompartilharUpdate');

                PublicacoesService.populateDisciplinas(disciplinasSelect, function() {    
                    tituloPub.val(pub.Titulo);
                    disciplinasSelect.val(pub.Disciplina);    
                    updateMural.show();
                    tituloPub.focus();
                });
            },
            muralLikeClick: function(e) {
                var userId = app.getUserData().Id;

                if (!PublicacoesService.findLike(e.data.Likes, userId)) {
                    PublicacoesService.pushLikes(dataProvider, e.data.Id, app.getUserData().Id, function(data) {
                        var $likesCount = $(e.currentTarget).closest('div').find('#likesCount');
                        $likesCount.text(Number($likesCount.text())+data);

                        // Adidiona Like na lista.
                        e.data.Likes.push(userId);
                        $(e.currentTarget).parent().addClass('smiley-curtiu');
                    });        
                } else {
                    PublicacoesService.popLikes(dataProvider, e.data.Id, app.getUserData().Id, function(data) {
                        var $likesCount = $(e.currentTarget).closest('div').find('#likesCount');
                        $likesCount.text(Number($likesCount.text())-data);

                        // Remove Like na lista.
                        //delete e.data.Likes[e.data.Likes.indexOf(userId)];
                        e.data.Likes.splice(e.data.Likes.indexOf(userId), 1);
                        $(e.currentTarget).parent().removeClass('smiley-curtiu');
                    }); 
                }
            },
            mensagemClick: function(e) {
                var $mensagem = $('#header-mural-mensagem');
                
                if ($mensagem.is(':visible')) {
                    $mensagem.hide();
                } else {
                    $mensagem.show();
                }
            },
            muralSendMsgClick: function(e) {
                var $novaMensagem = $('#novaMensagem');
                var $titulo = $('#tituloCompartilhar');
                var $disciplina = $('#mural-disciplina-select');

                if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                if (!PublicacoesService.verificaDisciplina($disciplina)) {
                    return;
                }

                var texto = $novaMensagem.val().replace(/\n/g, '<br>');

                PublicacoesService.createPublicacao(dataProvider, 'msg', texto, $titulo.val(), null, null, null, $disciplina.val(), null, function(pub) {
                    muralViewModel.muralCancelMsgClick(e);

                    $("#muralListView").data("kendoMobileListView").prepend([pub]);


                    //var listView = $("#muralListView").kendoMobileListView();
                    //listView.refresh();                        
                });
            },
            muralCancelMsgClick: function(e) {
                $('#header-mural-mensagem').hide();
                $('#novaMensagem').val('');
                $('#tituloCompartilhar').val('');
                $('#mural-disciplina-select').val('');
            },
            muralCommentClick: function(e) {
                var $comments = $(e.currentTarget).closest('ul').parent().closest('ul').find('#header-mural-comentario');

                if ($comments.is(':visible')) {
                    $comments.hide();
                } else {
                    $comments.show().siblings().hide();
                }
            },
            muralCancelCommentClick: function(e) {
                var $comment = $(e.currentTarget).closest('ul').find('#novoComentario');

                $comment.val('');
                $(e.currentTarget).closest('ul').find('#header-mural-comentario').hide();
            },
            muralSendCommentClick: function(e) {
                function getComentario(comentarioId, cb) {
                    var queryCursos = new Everlive.Query();
                    queryCursos.where().eq('Id', comentarioId);

                    var dataCursos = dataProvider.data('PublicacoesComentarios');
                    dataCursos.get(queryCursos)
                        .then(function(data) {
                            if (cb) {
                                try {
                                    cb(data.result);
                                } catch(e) {
                                    app.alert('Error: '+e.message);
                                }
                            }
                        }, function(err) {
                            app.alert('Error loading data (Users)');
                        });
                };

                var element = e;
                var $comment = $(element.currentTarget).closest('ul').find('#novoComentario');

                if (!PublicacoesService.verificaTitulo($comment, 'Favor informar o comentário!')) {
                    return;
                }

                PublicacoesService.createComentarios(dataProvider, $comment.val(), app.getUserData().Id, function(comentario) {
                    if (comentario) {
                        PublicacoesService.pushComentarios(dataProvider, element.data.Id, comentario.Id, function(data) {
                            var $commentsCount = $(element.currentTarget).closest('ul').find('#commentsCount');
                            $commentsCount.text(Number($commentsCount.text())+data);

                            $comment.val('');
                            muralViewModel.muralCommentClick(element);
                            $(element.currentTarget).closest('ul').find('#header-mural-comentario').hide();

                            // Adidiona Comentario na lista.
                            getComentario(comentario.Id, function(data) {
                                e.data.Comentarios.push(data[0]);
                            })
                        });
                    }
                });
            },
            muralCommentsListClick: function(e) {
                var allLoaded;

                function getUser(index, userId, cb) {
                    var queryCursos = new Everlive.Query();
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
                        });
                };

                function populate($commentList, comentarios) {
                    var result = template(comentarios);

                    $commentList.html(result);
                    $commentList.show().siblings().hide();
                };

                if (e.data.Comentarios.length) {
                    var $commentList = $(e.currentTarget).closest('ul').find('#header-mural-comentario-list');

                    if ($commentList.is(':visible')) {
                        $commentList.hide();
                    } else {
                        var template = kendo.template($("#comment-list-template").html());
                        
                        allLoaded = true;
                        for (var i=0; i < e.data.Comentarios.length; i++) {
                            if (!e.data.Comentarios[i].User.Id) {
                                allLoaded = false;

                                getUser(i, e.data.Comentarios[i].User, function(index, data) {
                                    e.data.Comentarios[index].User = data[0];

                                    if (index == e.data.Comentarios.length-1) {
                                        populate($commentList, e.data.Comentarios);
                                    }
                                });
                            }
                        }

                        if (allLoaded) {
                            populate($commentList, e.data.Comentarios);
                        }
                    }
                }
            },
            muralEditMenuClick: function(e) {
                var pub = {pub: e.data, view: $('#muralListView'), dataSource: dataSource};

                $("#publicacaoActions").data("kendoMobileActionSheet").open($(e.currentTarget), pub);
            },
            muralShareClick: function(e) {
                var data = {pub: e.data, view: $('#muralListView'), dataSource: dataSource};
                $("#compartilharActions").data("kendoMobileActionSheet").open($(e.currentTarget), data);
            },
            muralEditSharePublicacaoClick: function(e) {
                var pub = e.data;
                var updateMural = $(e.currentTarget).closest('#reply-mural-publicacoes');

                var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
                var tituloPub = updateMural.find('#tituloCompartilharUpdate');

                if (!PublicacoesService.verificaTitulo(tituloPub, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                if (!PublicacoesService.verificaDisciplina(disciplinasSelect)) {
                    return;
                }

                PublicacoesService.createPublicacao(dataProvider, pub.Tipo, pub.Texto, tituloPub.val(), pub.FileName, pub.FileSize, pub.AnexoUri, disciplinasSelect.val(), pub, function(pubAdd) {
                    //$(e.currentTarget).closest('li').find('#mural-titulo').text(tituloPub.val());

                    updateMural.hide();
                    disciplinasSelect.val('');
                    tituloPub.val('');  

                    dataSource.add(pubAdd);
                    var newEl = $('#muralListView').data("kendoMobileListView").prepend([pubAdd]);
                    connectMuralEvents(newEl);
                });
            },
            muralCancelEditSharePublicacaoClick: function(e){
                $(e.currentTarget).closest('#reply-mural-publicacoes').hide();
            },
            muralEditPublicacaoClick: function(e) {
                var pub = e.data;
                var updateMural = $(e.currentTarget).closest('#update-mural-publicacoes');

                var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
                var tituloPub = updateMural.find('#tituloCompartilharUpdate');

                PublicacoesService.updatePublicacao(dataProvider, pub.Id, tituloPub.val(), disciplinasSelect.val(), pub, function() {
                    $(e.currentTarget).closest('li').find('#mural-titulo').text(tituloPub.val());

                    updateMural.hide();
                    disciplinasSelect.val('');
                    tituloPub.val('');             
                });
            },
            muralCancelEditPublicacaoClick: function(e){
                $(e.currentTarget).closest('#update-mural-publicacoes').hide();
            },
            /*muralUpdatePublicacaoClick: function(e) {
                var pub = e.data;
                var updateMural = $(e.currentTarget).closest('#reply-mural-publicacoes');

                var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
                var tituloPub = updateMural.find('#tituloCompartilharUpdate');

                PublicacoesService.updatePublicacao(dataProvider, pub.Id, tituloPub.val(), disciplinasSelect.val(), pub, function() {
                    $(e.currentTarget).closest('li').find('#mural-titulo').text(tituloPub.val());

                    updateMural.hide();
                    disciplinasSelect.val('');
                    tituloPub.val('');
                });
            },*/
            muralPublicacoesCloseClick: function(e) {
                $('#appDrawer').data('kendoMobileDrawer').show();
            },
            cameraClick: function(e) {
                var pub = {pub: e.data, view: $('#muralListView'), dataSource: dataSource, connectEvent: connectMuralEvents};

                var $titulo = $(e.target).closest('form').find('.js-titulo');  //$(tituloId);
                if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                var $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');  //$('#mural-disciplina-select');
                if (!PublicacoesService.verificaDisciplina($disciplina)) {
                    return;
                }

                $("#muralImageActions").data("kendoMobileActionSheet").open($(e.currentTarget), pub);
            },
            uploadFileClick: function(e) {
                PublicacoesService.runFile(dataProvider);
            },
            getTempoDecorrido: function(datetime) {
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
                    text = days+" dia(s) atrás";
                } else if (hours > 0) {
                    text = hours+" hora(s) atrás";
                } else if (mins > 0) {
                    text = mins+" minuto(s) atrás";
                }

                return text;
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
            parent.set('muralViewModel', muralViewModel);
        });
    } else {
        parent.set('muralViewModel', muralViewModel);
    }

    
    parent.set('onShow', function(e) {
        try {
            app.mobileApp.showLoading(); 
            $('#appDrawer').data('kendoMobileDrawer').hide();
            
            muralViewModel.disciplinas = MkzDataService.getDisciplinas();

            if (e.view.params.tipo && e.view.params.tipo == 'minhaspub') {
                e.view.element.find('#header-minhas-publicacoes').show(); //.siblings().hide(); 
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
            app.showQuizzBadgeTimer();

            PublicacoesService.populateDisciplinas($('#mural-disciplina-select'));

            // Armazena o parametro recebido pela VIEW
            param = {
                logic:"or",
                filters: []
            };

            var disciplinas = MkzDataService.getDisciplinas();

            for (var i = 0; i < disciplinas.length; i++) {
                var fieldFilter = {field: 'Disciplina', operator: 'eq', value: disciplinas[i].Id};
                param.filters.push(fieldFilter);
            }

            if (e.view.params.tipo && e.view.params.tipo == 'minhaspub') {
                param = {
                    logic: "and",
                    filters: [
                        param,
                        { field:"User", operator:"eq", value: app.getUserData().Id }
                    ]
                }
            }

            viewParam = param;

            fetchFilteredData(viewParam);    
        } catch(err) {
            app.mobileApp.hideLoading();
        }
    });

    function getMuralDataItem(el) {
        var e = {};
        e.currentTarget = el;
        e.li = $(el).closest('[data-uid]');  //$(e).closest('li').parents('li');
        e.data = app.muralView.muralViewModel.get('dataSource').getByUid(e.li.attr('data-uid'));

        return e;
    };

    function connectMuralEvents(el) {
        el.find('#mural-edit-menu').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralEditMenuClick(e);
        });

        el.find('#mural-cancel-edit-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralCancelEditPublicacaoClick(e);
        });

        el.find('#mural-edit-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralEditPublicacaoClick(e);
        });

        el.find('#mural-share').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralShareClick(e);
        });     

        el.find('#mural-cancel-edit-share-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralCancelEditSharePublicacaoClick(e);
        }); 

        el.find('#mural-edit-share-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralEditSharePublicacaoClick(e);
        });

        el.find('#mural-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralCommentClick(e);
        });

        el.find('#mural-cancel-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralCancelCommentClick(e);
        });    

        el.find('#mural-send-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralSendCommentClick(e);
        });

        el.find('#mural-comment-list').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralCommentsListClick(e);
        });

        el.find('#mural-like').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.muralView.muralViewModel.muralLikeClick(e);
        });
    };

})(app.muralView);
