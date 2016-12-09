'use strict';

app.disciplinasView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {
    var headerMuralId = '#header-disciplinas-mensagem';
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('disciplinasViewModel'),
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
            /*type: 'everlive',
            transport: {
                typeName: 'Disciplinas',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": {"Professor": true}
                    }
                }
            },*/
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },           
            requestEnd: function(e) {
                app.mobileApp.hideLoading();
            },
            error: function(e) {
                app.mobileApp.hideLoading();
                if (e.xhr) {
                    app.alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'Nome': {
                            field: 'Nome',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        disciplinasViewModel = kendo.observable({
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

                if (!data.Professor) {
                    data.Professor = {};
                }

                if (data.Professor && !data.Professor.Nome) {
                    data.Professor.Nome = '';
                }

                if (data.Professor.Unidade && data.Professor.Unidade == '') {
                    data.Professor.Unidade = '?';
                }

                if (data.Professor.Turma && data.Professor.Turma == '') {
                    data.Professor.Turma = '?';
                }

                if (data.Professor.Sala && data.Professor.Sala == '') {
                    data.Professor.Sala = '?';
                }

                result.LoggedUser = app.getUserData().Id;

                return result;
            },
            itemClick: function(e) {
                try {
                    app.mobileApp.showLoading(); 

                    var dataItem = e.dataItem || disciplinasViewModel.originalItem;
                    disciplinasViewModel.set('currentDisciplina', e.dataItem);

                    app.cursosView.cursosViewModel.loadPublicacoes(e.dataItem.Id, function(publicacoes) {
                        app.disciplinasView.disciplinasViewModel.set('publicacoes', publicacoes);
                        
                        app.disciplinasView.disciplinasViewModel.set('publicacoesCount', 
                            { doc: publicacoes.docCount,
                              video: publicacoes.videoCount,
                              image: publicacoes.imageCount,
                              msg: publicacoes.msgCount });                    

                        app.avaliacoesView.avaliacoesViewModel.loadAvaliacoes(e.dataItem.Id, function(data) {
                            disciplinasViewModel.set('avaliacoes', data);
                            app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + e.dataItem.uid);
                        });
                    });
                } catch(err) {
                    app.mobileApp.hideLoading();                     
                }
                //app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + dataItem.uid);
            },
            detailsShow: function(e) {
                app.displayUser();
                disciplinasViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = disciplinasViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel) {
                    app.alert('error loading disciplinas');
                    return;
                }
                
                if (!itemModel.Nome) {
                    itemModel.Nome = String.fromCharCode(160);
                }

                disciplinasViewModel.set('originalItem', itemModel);
                disciplinasViewModel.set('currentItem', disciplinasViewModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            avaliacaoClick: function(e) {
                //app.avaliacoesView.avaliacoesViewModel.itemClick(e);
                var item = e.button.parents('li').attr('data-uid');
                var model = disciplinasViewModel.get('avaliacoes');
                var dataItem;

                for (var i=0; i < model.length; i++) {
                    if (model[i].uid == item) {
                        dataItem = model[i];
                        break;
                    }
                }

                dataItem.Flow = 'disciplinas';      
                app.avaliacoesView.avaliacoesViewModel.set('currentItem', dataItem);

                app.avaliacoesView.avaliacoesViewModel.loadQuestoesAvaliacao(dataItem.Id, function(data) {
                    app.avaliacoesView.avaliacoesViewModel.set('currentItemQuestoes', data);

                    app.mobileApp.navigate('#components/avaliacoesView/details.html?uid=' + dataItem.uid);
                });
            },
            jaRealizadoClick: function(e) {
                var item = e.button.parents('li').attr('data-uid');
                var model = disciplinasViewModel.get('avaliacoes');
                var dataItem;

                for (var i=0; i < model.length; i++) {
                    if (model[i].uid == item) {
                        dataItem = model[i];
                        break;
                    }
                }

                dataItem.Flow = 'disciplinas';      
                app.avaliacoesView.avaliacoesViewModel.set('currentItem', dataItem);
                
                app.avaliacoesView.avaliacoesViewModel.loadQuestoesAvaliacao(dataItem.Id, function(questoes) {
                    //app.avaliacoesView.avaliacoesViewModel.set('currentItemQuestoes', questoes);
                    app.avaliacoesView.avaliacoesViewModel.loadRespostasAvaliacao(questoes, dataItem.Id, function(respostas) {
                        app.avaliacoesView.avaliacoesViewModel.set('currentItemRespostas', respostas);

                        app.mobileApp.navigate('#components/avaliacoesView/result.html?uid=' + dataItem.uid);
                    });
                });
            },
            detailBackClick: function(e) {
                //app.cursosView.cursosViewModel.get('currentItem', app.cursosView.cursosViewModel.get('originalItem'));
                history.go(-1);
                /*var dataItem = app.cursosView.cursosViewModel.get('originalItem');
                app.mobileApp.navigate('#components/cursosView/details.html?uid=' + dataItem.uid);*/
            },
            publicacoesTabSelect: function(e) {
                if (e.currentTarget.id === 'btDocs') {
                    $('#tabPubDocs').show().siblings().hide();
                } else if (e.currentTarget.id === 'btImages') {
                    $('#tabPubImages').show().siblings().hide();
                } else if (e.currentTarget.id === 'btMsgs') {
                    $('#tabPubMsgs').show().siblings().hide();
                } else if (e.currentTarget.id === 'btVideos') {
                    $('#tabPubVideos').show().siblings().hide();
                }
            },

            muralPublicacaoReply: function(e) {
                var pub = e.context.pub;
                var ele = e.context.view;
                //var dataProvider = app.data.mackenzie;
                var dataSource = e.context.dataSource;

                PublicacoesService.createPublicacao(dataProvider, pub.Tipo, null, null, null, null, null, pub.Disciplina, pub, function(pubAdd) {
                    dataSource.push(pubAdd);
                    var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                    connectMuralEvents(newEl);                                  
                });
            },
            muralPublicacaoEditBeforeReply: function(e) {
                var pub = e.context;
                var updateMural = $(e.target).closest('[data-uid]').find('#reply-mural-publicacoes'); // e.target.closest('ul').parent().closest('ul').find('#reply-mural-publicacoes');

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

                if (!e.data) {
                    e = getMuralDataItem(e.currentTarget);
                }

                if (!PublicacoesService.findLike(e.data.Likes, userId)) {
                    PublicacoesService.pushLikes(dataProvider, e.data.Id, app.getUserData().Id, function(data) {
                        var $likesCount = $(e.currentTarget).closest('li').parents('li').find('#likesCount');
                        $likesCount.text(Number($likesCount.text())+data);

                        // Adidiona Like na lista.
                        e.data.Likes.push(userId);
                        $(e.currentTarget).parent().addClass('smiley-curtiu');
                    });
                } else {
                    PublicacoesService.popLikes(dataProvider, e.data.Id, app.getUserData().Id, function(data) {
                        var $likesCount = $(e.currentTarget).closest('li').parents('li').find('#likesCount');
                        $likesCount.text(Number($likesCount.text())-data);

                        // Remove Like na lista.
                        //delete e.data.Likes[e.data.Likes.indexOf(userId)];
                        e.data.Likes.splice(e.data.Likes.indexOf(userId), 1);
                        $(e.currentTarget).parent().removeClass('smiley-curtiu');
                    }); 
                }
            },
            mensagemClick: function(e) {
                var $mensagem = $(headerMuralId);

                if ($mensagem.is(':visible')) {
                    $mensagem.hide();
                } else {
                    $mensagem.show();
                }
            },
            muralSendMsgClick: function(e) {
                var $novaMensagem = $('#novaMensagemDisciplina');
                var $titulo = $('#disciplinaTituloCompartilhar');

                if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                var texto = $novaMensagem.val().replace(/\n/g, '<br>');
                var current = disciplinasViewModel.get('currentDisciplina');

                //var pub = e.context.pub;
                var ele = e.context.view;
                var dataSource = e.context.dataSource;

                PublicacoesService.createPublicacao(dataProvider, 'msg', texto, $titulo.val(), null, null, null, current.Id, function(pubAdd) {
                    disciplinasViewModel.muralCancelMsgClick(e);

                    dataSource.push(pubAdd);
                    var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                    connectMuralEvents(newEl);
                });
            },
            muralCancelMsgClick: function(e) {
                $(headerMuralId).hide();
                $('#novaMensagemDisciplina').val('');
            },
            muralCommentClick: function(e) {
                var $comments = $(e.currentTarget).closest('[data-uid]').find('#header-mural-comentario');  //$(e.currentTarget).closest('ul').parent().closest('ul').find('#header-mural-comentario');
                
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
                            disciplinasViewModel.muralCommentClick(element);
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
                    var $commentList = $(e.currentTarget).closest('[data-uid]').find('#header-mural-comentario-list');  // $(e.currentTarget).closest('ul').find('#header-mural-comentario-list');

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
            /*muralShareClick: function(e) {
                var pub = e.data;

                PublicacoesService.createPublicacao(dataProvider, pub.Tipo, pub.Texto, pub.Titulo, pub.FileName, pub.FileSize, pub.AnexoUri, pub.Disciplina);
            },
            muralPublicacoesCloseClick: function(e) {
                $('#appDrawer').data('kendoMobileDrawer').show();
            },
            cameraClick: function(e) {
                var current = disciplinasViewModel.get('currentDisciplina');
                PublicacoesService.cameraPub(dataProvider, '#disciplinaTituloCompartilhar', current.Id);
            },*/



            muralEditMenuClick: function(e) {
                var pub = {pub: e.data, view: getSelectedListView(), dataSource: disciplinasViewModel.get('publicacoes')};
                $("#componentePublicacaoActions").data("kendoMobileActionSheet").open($(e.currentTarget), pub);
            },
            muralShareClick: function(e) {
                //var pub = e.data;
                var pub = {pub: e.data, view: getSelectedListView(), dataSource: disciplinasViewModel.get('publicacoes')};
                $("#componenteCompartilharActions").data("kendoMobileActionSheet").open($(e.currentTarget), pub);
            },
            muralEditSharePublicacaoClick: function(e) {
                var pub = e.data;
                var dataSource = disciplinasViewModel.get('publicacoes');

                var current = disciplinasViewModel.get('currentDisciplina');
                var updateMural = $(e.currentTarget).closest('#reply-mural-publicacoes');

                //ar disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
                var tituloPub = updateMural.find('#tituloCompartilharUpdate');

                if (!PublicacoesService.verificaTitulo(tituloPub, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                PublicacoesService.createPublicacao(dataProvider, pub.Tipo, pub.Texto, tituloPub.val(), pub.FileName, pub.FileSize, pub.AnexoUri, current.Id, pub, function(pubAdd) {
                    $(e.currentTarget).closest('li').find('#mural-titulo').text(tituloPub.val());

                    updateMural.hide();
                    //disciplinasSelect.val('');
                    tituloPub.val('');  

                    dataSource.push(pubAdd);
                    var newEl = getSelectedListView().data("kendoMobileListView").prepend([pubAdd]);
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

                PublicacoesService.updatePublicacao(dataProvider, pub.Id, tituloPub.val(), disciplinasSelect.val(), pub, function(pubEdit) {
                    var $titulo = $(e.currentTarget).closest('li').find('#mural-titulo');

                    if (tituloPub.val() != '') {
                        $titulo.text(tituloPub.val()).show();
                    } else {
                        $titulo.text(tituloPub.val()).hide();
                    }

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
                var current = disciplinasViewModel.get('currentDisciplina');
                var pub = {pub: e.data, view: getSelectedListView(), dataSource: disciplinasViewModel.get('publicacoes'), disciplinaId: current.Id, connectEvent: connectMuralEvents};
                //PublicacoesService.cameraPub(dataProvider, '#disciplinaTituloCompartilhar', current.Id);

                var $titulo = $(e.target).closest('form').find('.js-titulo');  //$(tituloId);
                if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                /*var $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');  //$('#mural-disciplina-select');
                if (!PublicacoesService.verificaDisciplina($disciplina)) {
                    return;
                }*/

            // INTEGRACAO DADOS MACKENZIE
                //$("#componenteImageActions").data("kendoMobileActionSheet").open($(e.currentTarget), {disciplinaId: current.Id});
                $("#componenteImageActions").data("kendoMobileActionSheet").open($(e.currentTarget), pub);
            // INTEGRACAO DADOS MACKENZIE
            },
            uploadFileClick: function(e) {
                PublicacoesService.runFile(dataProvider);
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
                    var param = [{ field: "Nome", operator: "contains", value: valueField }];
                } else {
                    var param = [viewParam, { field: "Nome", operator: "contains", value: valueField }];
                }

                fetchFilteredData(param);
            },
            selectAvaliacoes: function(e) {
                $('#tabAvaliacoes').show().siblings().hide();
            },
            selectPublicacoes: function(e) {
                $('#tabPublicacoes').show().siblings().hide();
            },
            currentItem: {}
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('disciplinasViewModel', disciplinasViewModel);
        });
    } else {
        parent.set('disciplinasViewModel', disciplinasViewModel);
    }

    parent.set('onShow', function(e) {
        try {
            app.mobileApp.showLoading(); 
            $('#appDrawer').data('kendoMobileDrawer').hide();

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

            // INTEGRACAO DADOS MACKENZIE
            populate(MkzDataService.getDisciplinas());

            function populate(disciplinas) {
                // Fixa o filtro dos cursos do usuário logado
                param = {};

                // Armazena o parametro recebido pela VIEW
                viewParam = param;

                dataSource.data(disciplinas);
                console.log('disciplinas:', disciplinas);

                //fetchFilteredData();
            };
            // INTEGRACAO DADOS MACKENZIE
        } catch(err) {
            app.mobileApp.hideLoading();
        }
    });

    parent.set('onDetailShow', function(e) {
        var publicacoesCount = disciplinasViewModel.get('publicacoesCount');

        if (publicacoesCount) {
            $('#tabAvaliacoes #docsCount').text(publicacoesCount.doc);
            $('#tabAvaliacoes #videosCount').text(publicacoesCount.video);
            $('#tabAvaliacoes #imagesCount').text(publicacoesCount.image);
            $('#tabAvaliacoes #msgsCount').text(publicacoesCount.msg);
        }

        disciplinasViewModel.selectAvaliacoes();
    });


    function getMuralDataItem(el) {
        var e = {};
        e.currentTarget = el;
        e.li = $(el).closest('[data-uid]');

        var uid = e.li.attr('data-uid');
        e.data = app.disciplinasView.disciplinasViewModel.get('publicacoes').find(function(item) {
            return item.uid === uid;
        });

        return e;
    };

    function connectMuralEvents(el) {
        el.find('#mural-edit-menu').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralEditMenuClick(e);
        });

        el.find('#mural-cancel-edit-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralCancelEditPublicacaoClick(e);
        });

        el.find('#mural-edit-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralEditPublicacaoClick(e);
        });

        el.find('#mural-share').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralShareClick(e);
        });     

        el.find('#mural-cancel-edit-share-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralCancelEditSharePublicacaoClick(e);
        }); 

        el.find('#mural-edit-share-publicacao').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralEditSharePublicacaoClick(e);
        });

        el.find('#mural-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralCommentClick(e);
        });

        el.find('#mural-cancel-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralCancelCommentClick(e);
        });    

        el.find('#mural-send-comment').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralSendCommentClick(e);
        });

        el.find('#mural-comment-list').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralCommentsListClick(e);
        });

        el.find('#mural-like').click(function(e) {
            e = getMuralDataItem(e.currentTarget);
            app.disciplinasView.disciplinasViewModel.muralLikeClick(e);
        });
    };

    function getSelectedListView() {
        var tabName = $('#first-period-2 .km-state-active').attr('id').toLowerCase();
        var selectedView;

        if (tabName === 'btdocs') {
            selectedView = 'listPubDocs';
        } else if (tabName === 'btimages') {
            selectedView = 'listPubImages';
        } else if (tabName === 'btmsgs') {
            selectedView = 'listPubMsgs';
        } else if (tabName === 'btvideos') {
            selectedView = 'listPubVideos';
        }

        return $('#'+selectedView);
    };

})(app.disciplinasView);
