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
            sort: [{ field: "CreatedAt", dir: "desc" }],
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

                result.TempoPublicacao = this.getTempoDecorrido(data.CreatedAt);

                return result;
            },
            muralLikeClick: function(e) {
				PublicacoesService.pushLikes(dataProvider, e.data.Id, app.getUserData().Id, function(data) {
                	var $likesCount = $(e.currentTarget).closest('div').find('#likesCount');
                	$likesCount.text(Number($likesCount.text())+data);
		        });            	
				/*var dataPublicacoes = dataProvider.data('Publicacoes');

				// "$push" adds an item to an array.
				// "$addToSet" adds elements to an array only if they do not already exist in the set.
				var attributes = {
				    "$push": {
				        "Likes": app.getUserData().Id
				    }
				};

				var filter = {
				    'Id': e.data.Id
				};

				dataPublicacoes.rawUpdate(attributes, filter,
					function (data) {
						if (data.result) {
	                    	var $likesCount = $(e.currentTarget).closest('div').find('#likesCount');
	                    	$likesCount.text(Number($likesCount.text())+data.result);
						}
					},
					function (error) {
				    	console.log(JSON.stringify(error));
					}
				);*/
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

                if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
                    return;
                }

                var texto = $novaMensagem.val().replace(/\n/g, '<br>');

                PublicacoesService.createPublicacao(dataProvider, 'msg', texto, $titulo.val(), null, null, null, null, function() {
                    muralViewModel.muralCancelMsgClick(e);
                    //var listView = $("#muralListView").kendoMobileListView();
                    //listView.refresh();                        
                });
            },
            muralCancelMsgClick: function(e) {
                $('#header-mural-mensagem').hide();
                $('#novaMensagem').val('');
            },
            muralCommentClick: function(e) {
                var $comments = $(e.currentTarget).closest('ul').siblings('#header-mural-comentario');
                if ($comments.is(':visible')) {
                    $(e.currentTarget).closest('ul').siblings('#header-mural-comentario').hide();
                } else {
                    $(e.currentTarget).closest('ul').siblings('#header-mural-comentario').show();
                }
            },
            muralCancelCommentClick: function(e) {
                var $comment = $(e.currentTarget).closest('ul').find('#novoComentario');
                $comment.val('');
                $(e.currentTarget).closest('ul').find('#header-mural-comentario').hide();
            },
            muralSendCommentClick: function(e) {
            	var element = e;
            	/*function updatePublicacoes(publicacoesId, comentarioId, cb) {
                    var dataPublicacoes = dataProvider.data('Publicacoes');

					var attributes = {
					    "$push": {
					        "Comentarios": comentarioId
					    }
					};

					var filter = {
					    'Id': publicacoesId
					};

					dataPublicacoes.rawUpdate(attributes, filter,
						function (data) {
							if (data.result) {
		                    	if (cb) {
		                    		cb(data.result);
		                    	}
							}
						},
						function (error) {
					    	console.log(JSON.stringify(error));
						}
					);
            	}*/

            	var $comment = $(element.currentTarget).closest('ul').find('#novoComentario');

                if (!PublicacoesService.verificaTitulo($comment, 'Favor informar o comentário!')) {
                    return;
                }

            	PublicacoesService.createComentarios(dataProvider, $comment.val(), app.getUserData().Id, function(data) {
			        if (data) {
                        console.log('User Id:', element.data.Id, 'Comentario Id:', data.Id);
				        //updatePublicacoes(e.data.Id, data.result.Id, function(data) {
				        PublicacoesService.pushComentarios(dataProvider, element.data.Id, data.Id, function(data) {
                            var $commentsCount = $(element.currentTarget).closest('ul').find('#commentsCount');
                            $commentsCount.text(Number($commentsCount.text())+data);

                            $comment.val('');
                            muralViewModel.muralCommentClick(element);
                            $(element.currentTarget).closest('ul').find('#header-mural-comentario').hide();
				        });
			        }
            	});
            	/*var dataComentarios = dataProvider.data('PublicacoesComentarios');

				dataComentarios.create({
                        'Comentario': textComment,
                        'User': app.getUserData().Id
                    },
				    function(data){
				        if (data.result) {
                            console.log('User Id:', e.data.Id, 'Comentario Id:', data.result.Id);
					        //updatePublicacoes(e.data.Id, data.result.Id, function(data) {
					        PublicacoesService.pushComentarios(dataProvider, e.data.Id, data.result.Id, function(data) {
                                var $commentsCount = $(e.currentTarget).closest('ul').find('#commentsCount');
                                $commentsCount.text(Number($commentsCount.text())+data);

                                $comment.val('');
                                muralViewModel.muralCommentClick(e);
                                $(e.currentTarget).closest('ul').find('#header-mural-comentario').hide();
					        });
				        }
				    },
				    function(error){
				        alert(JSON.stringify(error));
				    });*/
            },
            muralShareClick: function(e) {
            	alert('share');
            },
            muralPublicacoesCloseClick: function(e) {
                $('#appDrawer').data('kendoMobileDrawer').show();
            },
            cameraClick: function(e) {
                PublicacoesService.cameraPub(dataProvider, '#tituloCompartilhar');
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
			    	text = hours+" hora(s) atrás";
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
    	if (e.view.params.tipo && e.view.params.tipo == 'minhaspub') {
	        e.view.element.find('#header-minhas-publicacoes').show().siblings().hide(); 
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

        // Armazena o parametro recebido pela VIEW
        param = {
            logic:"or",
            filters: [
                {field: "Disciplina", operator: "eq", value: ''},
                {field: "Disciplina", operator: "eq", value: null},
            ]
        };

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
    });

    /*function verificaTitulo() {
        var $titulo = $('#tituloCompartilhar');

        if ($titulo && $titulo.val() == '') {
            alert('Favor informar o titulo da publicacao!');
            return;
        }

        return $titulo;
    }

    function createPublicacao(tipo, texto, titulo, fileName, fileSize, anexoUri, disciplina, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        dataPublicacoes.create(
            {
                'FileName': fileName ? fileName : '',
                'FileSize': fileSize ? fileSize : '',
                'Disciplina': disciplina ? disciplina : '',
                'Comentarios': '',
                'Likes': '',
                'AnexoUri': anexoUri ? anexoUri : '',
                'Texto': texto ? texto : '',
                'Tipo': tipo,
                'Titulo': titulo ? titulo : '',
                'User': app.getUserData().Id
            },
            function(data){
                if (data.result) {
                    console.log('Create publicacoes:', data.result);

                    if (cb) {
                        try {
                            cb();
                        } catch(e) {
                            alert('Error on Create Publicacoes: '+e.message);
                        }
                    }
                }
            },
            function(error){
                alert('Erro ao gravar Publicacoes! '+error.message);
            }
        );
    };     

    function cameraPub() {
        var $titulo;

        function onPictureSuccess(imageData) {
            var file = {
                Filename: '\\mural\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
                ContentType: "image/jpeg",
                base64: imageData,
            };

            dataProvider.Files.create(file, function(response) {                        
                createPublicacao('image', null, $titulo.val(), null, null, response.result.Uri, null, function() {
                    $titulo.val('');
                    //var listView = $("#muralListView").kendoMobileListView();
                    //listView.refresh();                        
                });
            }, function(err) {
                navigator.notification.alert("Unfortunately the upload failed: " + err.message);
            });
        };

        function onPictureError() {
            navigator.notification.alert("Falha no acesso à camera!");
        };           

        $titulo = $('#tituloCompartilhar');

        if ($titulo && $titulo.val() == '') {
            alert('Favor informar o titulo da publicacao!');
            return;
        }

        app.RunCamera(400, 300, onPictureSuccess, onPictureError);  
    }*/

})(app.muralView);
