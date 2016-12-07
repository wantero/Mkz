var PublicacoesService = {
    findLike: function(likeList, userId) {
        for (var i=0; i <= likeList.length; i++) {
            if (likeList[i] == userId) {
                return true;
            }
        }

        return false;
    },

    verificaTitulo: function($element, msg) {
        if ($element && $element.val() == '') {
            app.alert(msg);
            return false;
        }

        return true;
    },

    verificaDisciplina: function($element) {
        var user = app.getUserData();
        
        if (user.Tipo == 'P' && MkzDataService.getDisciplinas().length == 0) {
            return true;
        }

        if ($element && (!$element.val() || $element.val() == '')) {
            app.alert('Favor informar o componente para a publicação!');
            return false;
        }

        return true;
    },

    createPublicacao: function(dataProvider, tipo, texto, titulo, fileName, fileSize, anexoUri, disciplinaId, publicacao, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        var novaPublicacao = {
            'FileName': fileName ? fileName : '',
            'FileSize': fileSize ? fileSize : '',
            'Disciplina': disciplinaId ? disciplinaId : '',
            'Comentarios': [],
            'Likes': [],
            'AnexoUri': anexoUri ? anexoUri : '',
            'Texto': texto ? texto : '',
            'Tipo': tipo,
            'Titulo': titulo ? titulo : '',
            'CompartilhadoDe': publicacao ? (publicacao.CompartilhadoDe ? publicacao.CompartilhadoDe.Id : publicacao.Id) : '',
            // INTEGRACAO DADOS MACKENZIE
            'CompartilhadoDeUser': publicacao ? publicacao.User.Id: '',
            // INTEGRACAO DADOS MACKENZIE
            //'CompartilhadoDeUser': publicacao ? publicacao.User: '',
            // INTEGRACAO DADOS MACKENZIE
            'User': app.getUserData().Id
        };

        dataPublicacoes.create(novaPublicacao,
            function(data){
                if (data.result) {
                    console.log('Create publicacoes:', data.result);

                    if (cb) {
                        try {
                            novaPublicacao.CompartilhadoDe = publicacao ? (publicacao.CompartilhadoDe ? publicacao.CompartilhadoDe : publicacao) : '';
                            novaPublicacao.CompartilhadoDeUser = publicacao ? publicacao.User: '';
                            novaPublicacao.User = app.getUserData();
                            novaPublicacao.Owner = novaPublicacao.User.Id;

                            novaPublicacao = new kendo.data.Model(novaPublicacao);
                            app.muralView.muralViewModel.fixHierarchicalData(novaPublicacao);

                            if (novaPublicacao.CompartilhadoDe) {
                                app.pontos.add(2, function() {
                                    cb(novaPublicacao);
                                });
                            } else {
                                cb(novaPublicacao);
                            }
                        } catch(e) {
                            app.alert('Error on Create Publicacoes: '+e.message);
                        }
                    }
                }
            },
            function(error){
                app.alert('Erro ao gravar Publicacoes! '+error.message);
            }
        );
    },

    updatePublicacao: function(dataProvider, publicacaoId, titulo, disciplinaId, publicacao, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        dataPublicacoes.updateSingle(
            {
                'Id': publicacaoId,
                'Disciplina': disciplinaId,
                'Titulo': titulo
            },
            function(data){
                if (data.result) {
                    console.log('Update publicacoes:', data.result);

                    if (cb) {
                        try {
                            publicacao.Titulo = titulo;
                            publicacao.Disciplina = disciplinaId;
                            
                            cb(publicacao);
                        } catch(e) {
                            app.alert('Error on Update Publicacoes: '+e.message);
                        }
                    }
                }
            },
            function(error){
                app.alert('Erro ao gravar Publicacoes! '+error.message);
            }
        );
    },

    deletePublicacao: function(dataProvider, publicacaoId, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        dataPublicacoes.destroySingle(
            {
                'Id': publicacaoId
            },
            function(data){
                if (data.result) {
                    console.log('Delete publicacoes:', data.result);

                    if (cb) {
                        try {
                            cb({Id: publicacaoId});
                        } catch(e) {
                            app.alert('Error on Delete Publicacoes: '+e.message);
                        }
                    }
                }
            },
            function(error){
                app.alert('Erro ao gravar Publicacoes! '+error.message);
            }
        );
    },

    createComentarios: function(dataProvider, textComment, userId, cb) {
        var dataComentarios = dataProvider.data('PublicacoesComentarios');

        dataComentarios.create({
                'Comentario': textComment,
                'User': app.getUserData().Id
            },
            function(data){
                if (cb) {
                    try {
                        cb(data.result);
                    } catch(e) {
                        app.alert('CreateComentarios Error: '+e.message);
                    }
                }
            },
            function(error){
                app.alert('CreateComentarios Error: '+error.message);
            });
    },

    pushComentarios: function(dataProvider, publicacoesId, comentarioId, cb) {
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
                        try {
                            app.pontos.add(1, function() {
                                cb(data.result);
                            });
                        } catch(e) {
                            app.alert('PushLikes Error: '+e.message);
                        }
                    }
                }
            },
            function (error) {
                app.alert('PushLikes Error: '+error.message);
            }
        );
    },

    pushLikes: function(dataProvider, publicacoesId, userId, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        // "$push" adds an item to an array.
        // "$addToSet" adds elements to an array only if they do not already exist in the set.
        var attributes = {
            "$push": {
                "Likes": userId
            }
        };

        var filter = {
            'Id': publicacoesId
        };

        dataPublicacoes.rawUpdate(attributes, filter,
            function (data) {
                if (data.result) {
                    if (cb) {
                        try {
                            app.pontos.add(1, function() {
                                cb(data.result);
                            });
                        } catch(e) {
                            app.alert('PushLikes Error: '+e.message);
                        }
                    }
                }
            },
            function (error) {
                app.alert('PushLikes Error: '+error.message);
            }
        );
    },

    popLikes: function(dataProvider, publicacoesId, userId, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');


        // "$push" adds an item to an array.
        // "$addToSet" adds elements to an array only if they do not already exist in the set.
        var attributes = {
            "$pop": {
                "Likes": userId
            }
        };

        var filter = {
            'Id': publicacoesId
        };

        dataPublicacoes.rawUpdate(attributes, filter,
            function (data) {
                if (data.result) {
                    if (cb) {
                        try {
                            app.pontos.sub(1, function() {
                                cb(data.result);
                            });
                        } catch(e) {
                            app.alert('PopLikes Error: '+e.message);
                        }
                    }
                }
            },
            function (error) {
                app.alert('PopLikes Error: '+error.message);
            }
        );
    },

    updateUserImage: function(newFotoUri) {
        if (!app.muralView.muralViewModel) {
            return false;
        }

        var userData = app.getUserData();

        if (userData) {
            var userId = userData.Id;
            var pubList = app.muralView.muralViewModel.dataSource.data();
            var $mural = $('#muralListView').data("kendoMobileListView");

            userData.fotoUri = newFotoUri;            

            for (var idx in pubList) {
                var pub = pubList[idx];

                if (pub.User.Id == userId) {
                    pub.User.fotoUri = newFotoUri;

                    if (pub.CompartilhadoDeUser.Id = userId) {
                        pub.CompartilhadoDeUser.fotoUri = newFotoUri;
                    }

                    $mural.replace([pub]);
                }
            }
        }

        return true;
    },

    populateDisciplinasHtml: undefined,
    populateDisciplinas: function($disciplinasSelect, cb) {
        var dataProvider = app.data.mackenzie;

        function getCursos($disciplinasSelect, cb) {
            // INTEGRACAO DADOS MACKENZIE
            /*var queryCursos = new Everlive.Query();
            queryCursos.where().eq('Users', app.getUserData().Id);

            var dataCursos = dataProvider.data('Cursos');
            dataCursos.get(queryCursos)
                .then(function(data) {
                    var cursos = [];
                    for (var i=0; i < data.result.length; i++) {
                        cursos.push(data.result[i].Id);
                    }

                    getDisciplinas($disciplinasSelect, cursos, cb);
                }, function(err) {
                    app.alert('Error loading data (Cursos)');
                });*/
            // INTEGRACAO DADOS MACKENZIE

            // INTEGRACAO DADOS MACKENZIE
            getDisciplinas($disciplinasSelect, MkzDataService.getListCursosId(), cb);
            // INTEGRACAO DADOS MACKENZIE
        };

        function getDisciplinas($disciplinasSelect, cursos, cb) {
            // INTEGRACAO DADOS MACKENZIE
            /*var queryDisciplinas = new Everlive.Query();
            queryDisciplinas.where().isin('Cursos', cursos);

            var dataDisciplinas = dataProvider.data('Disciplinas');
            dataDisciplinas.get(queryDisciplinas)
                .then(function(data){
                    if (data.result) {
                        var html = '<option value="" disabled selected>Selecione um compnente</option>';

                        for (var i = 0; i < data.result.length; i++) {
                            html += '<option value="'+data.result[i].Id+'">'+data.result[i].Nome+'</option>';
                        }

                        PublicacoesService.populateDisciplinasHtml = html;
                        setHtml($disciplinasSelect, html, cb);
                    }
                }, function(Err) {
                    app.alert('Erro loading data (Disciplinas)');
                });*/
            // INTEGRACAO DADOS MACKENZIE

            // INTEGRACAO DADOS MACKENZIE
            var disciplinas = MkzDataService.getDisciplinas();
            var html = '<option value="" disabled selected>Selecione um componente</option>';

            for (var i = 0; i < disciplinas.length; i++) {
                html += '<option value="'+disciplinas[i].Id+'">'+disciplinas[i].Nome+'</option>';
            }

            PublicacoesService.populateDisciplinasHtml = html;
            setHtml($disciplinasSelect, html, cb);
            // INTEGRACAO DADOS MACKENZIE
        };

        function setHtml($disciplinasSelect, html, cb) {
            $disciplinasSelect.html(html);

            if (cb) {
                try {
                    cb();
                } catch(e) {
                    app.alert('Error getDisciplinas/PublicacoesService: '+e.message);
                } 
            }
        };

        // Popula a lista de componentes
        if (!PublicacoesService.populateDisciplinasHtml) {
            getCursos($disciplinasSelect, cb);
        } else {
            setHtml($disciplinasSelect, PublicacoesService.populateDisciplinasHtml, cb);
        }
    },

    cameraPub: function(dataProvider, tituloId, disciplinaId) {
        var $titulo, $disciplina;

        function onPictureSuccess(imageData, b, c) {
            var file = {
                Filename: '\\mural\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
                ContentType: "image/jpeg",
                base64: imageData,
            };

            dataProvider.Files.create(file, function(response) {                        
                PublicacoesService.createPublicacao(dataProvider, 'image', null, $titulo.val(), null, null, response.result.Uri, disciplinaId, null, function() {
                    $titulo.val('');
                    //var listView = $("#muralListView").kendoMobileListView();
                    //listView.refresh();                        
                });
            }, function(err) {
                app.alert("Unfortunately the upload failed: " + err.message);
            });
        };

        function onPictureError() {
            app.alert("Falha no acesso à camera!");
        };           

        $titulo = $(tituloId);
        if (!PublicacoesService.verificaTitulo($titulo, 'Favor informar o titulo da publicacao!')) {
            return;
        }

        if (!disciplinaId) {
            $disciplina = $('#mural-disciplina-select');

            if (!PublicacoesService.verificaDisciplina($disciplina)) {
                return;
            }

            disciplinaId = $disciplina.val();
        }

        PublicacoesService.runCamera(400, 300, onPictureSuccess, onPictureError);  
    },

    runCamera: function(width, height, success, error, options) {
        var cameraConfig = {
            targetWidth: width,
            targetHeight: height,
            destinationType: options && options.destination != undefined  ? options.destination : navigator.camera.DestinationType.DATA_URL,
            sourceType: options && options.type != undefined ? options.type : navigator.camera.PictureSourceType.PHOTOLIBRARY,
            mediaType: options && options.media != undefined  ? options.media : navigator.camera.MediaType.ALLMEDIA
        };

        navigator.camera.getPicture(success, error, cameraConfig);
    },

    runVideo: function(width, height, success, error, options) {
        var cameraConfig = {
            targetWidth: width,
            targetHeight: height,
            destinationType: options && options.destination != undefined  ? options.destination : navigator.camera.DestinationType.DATA_URL,
            sourceType: options && options.type != undefined ? options.type : navigator.camera.PictureSourceType.PHOTOLIBRARY,
            mediaType: options && options.media != undefined  ? options.media : navigator.camera.MediaType.ALLMEDIA
        };

        navigator.device.capture.captureVideo(success, error, cameraConfig);
    },

    runFile: function() {

    }
};

function onMuralPublicacaoReply(e) {
    var pub = e.context.pub;
    var ele = e.context.view;
    var dataProvider = app.data.mackenzie;
    var dataSource = e.context.dataSource;

    PublicacoesService.createPublicacao(dataProvider, pub.Tipo, null, null, null, null, null, pub.Disciplina, pub, function(pubAdd) {
        //var first = ele.find('li').eq(0);
        dataSource.add(pubAdd);
        var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
        console.log(newEl);

        newEl.find('#mural-edit-menu').click(function(e) {
            console.log(e);
            app.muralView.muralViewModel.muralEditMenuClick(this)
        });
    });
};

function onMuralPublicacaoEditBeforeReply(e) {
    var pub = e.context;
    var updateMural = e.target.closest('ul').parent().closest('ul').find('#reply-mural-publicacoes');

    var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
    var tituloPub = updateMural.find('#tituloCompartilharUpdate');

    PublicacoesService.populateDisciplinas(disciplinasSelect, function() {    
        tituloPub.val(pub.Titulo);
        disciplinasSelect.val(pub.Disciplina);    
        updateMural.show();
    });
};

function onMuralPublicacaoEdit(e) {
    var pub = e.context.pub;
    var updateMural = e.target.closest('[data-uid]').find('#update-mural-publicacoes');

    var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
    var tituloPub = updateMural.find('#tituloCompartilharUpdate');

    PublicacoesService.populateDisciplinas(disciplinasSelect, function() {    
        tituloPub.val(pub.Titulo);
        disciplinasSelect.val(pub.Disciplina);    
        updateMural.show();
    });
};

function onMuralPublicacaoDelete(e) {
    var pub = e.context.pub;
    var ele = e.context.view;

    PublicacoesService.deletePublicacao(app.data.mackenzie, pub.Id, function(pubDel) {
        ele.data("kendoMobileListView").remove([pub]);
    });
};

function onMuralCamera(e) {
    var $titulo, $disciplina, disciplinaId
        dataProvider = app.data.mackenzie;

    var pub = e.context.pub;
    var ele = e.context.view;
    var dataSource = e.context.dataSource;

    function onPictureSuccess(data) {
        var file = {
            Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
            ContentType: "image/jpeg",
            base64: data
        };

        $titulo = $(e.target).closest('form').find('.js-titulo');

        if (e.context && e.context.disciplinaId) {
            disciplinaId = e.context.disciplinaId;
        } else {
            $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');
            disciplinaId = $disciplina.val();
        }

        dataProvider.Files.create(file, function(response) {
            PublicacoesService.createPublicacao(dataProvider, 'image', null, $titulo.val(), null, null, response.result.Uri, disciplinaId, null, function(pubAdd) {
                $titulo.val('');

                if ($disciplina) {
                    $disciplina.val('');
                }
                
                // REFRESH
                if (!dataSource._data) {
                    dataSource.push(pubAdd);
                } else {
                    dataSource.add(pubAdd);
                }

                var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                console.log(newEl);
                e.context.connectEvent(newEl);
            });
        }, function(err) {
            app.alert("Falha no upload do arquivo: " + err.message);
        });  
    };

    function onPictureError(err) {
        if (!err.toLowerCase().startsWith("camera cancelled")) {
            app.alert("Falha no acesso à camera!");
        }
    };

    PublicacoesService.runCamera(400, 300, onPictureSuccess, onPictureError, {
        destination: navigator.camera.DestinationType.DATA_URL,
        type: navigator.camera.PictureSourceType.CAMERA,
        media: navigator.camera.MediaType.PICTURE
    });
};

function onMuralFilmadora(e) {
    var $titulo, $disciplina, disciplinaId
        dataProvider = app.data.mackenzie;

    var pub = e.context.pub;
    var ele = e.context.view;
    var dataSource = e.context.dataSource;

    function onVideoSuccess(data) {
        try {
            if (data.length > 1) {
                app.alert("Favor selecionar apenas um arquivo!");
            }

            data = data[0];

            window.resolveLocalFileSystemURL(data.localURL, function(entry) {
                saveFile(entry.toURL());
            });

            function saveFile(data) {
                var options = {
                    fileName: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".mp4",
                    mimeType: 'video/mp4'
                };

                $titulo = $(e.target).closest('form').find('.js-titulo');

                if (e.context && e.context.disciplinaId) {
                    disciplinaId = e.context.disciplinaId;
                } else {
                    $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');
                    disciplinaId = $disciplina.val();
                }

                dataProvider.Files.upload(data, options)
                    .then(function(data) {
                        data = JSON.parse(data.response);

                        if (data.Result.length > 1) {
                            app.alert("Favor selecionar apenas um arquivo!");
                            return;
                        }

                        data = data.Result[0];

                        PublicacoesService.createPublicacao(dataProvider, 'video', null, $titulo.val(), null, null, data.Uri, disciplinaId, null, function(pubAdd) {
                            $titulo.val('');

                            if ($disciplina) {
                                $disciplina.val('');
                            }
                            
                            // REFRESH
                            if (!dataSource._data) {
                                dataSource.push(pubAdd);
                            } else {
                                dataSource.add(pubAdd);
                            }

                            var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                            console.log(newEl);
                            e.context.connectEvent(newEl);
                        });
                }, function(err) {
                    app.alert("Falha no upload do arquivo: " + err.message);
                });   
            };

        } catch(e) {
          app.alert(JSON.stringify(e));  
        };
    };

    function onVideoError(err) {
        if (!err.code == 3) {
            app.alert("Falha no acesso à camera!"+JSON.stringify(err));
        }
    }; 

    PublicacoesService.runVideo(400, 300, onVideoSuccess, onVideoError, {
        destination: navigator.camera.DestinationType.DATA_URL,
        type: navigator.camera.PictureSourceType.CAMERA,
        media: navigator.camera.MediaType.VIDEO
    });
};

function onMuralFilePicture(e) {
    var $titulo, $disciplina, disciplinaId
        dataProvider = app.data.mackenzie;

    var pub = e.context.pub;
    var ele = e.context.view;
    var dataSource = e.context.dataSource;
    
    function onPictureSuccess(data) {
        var file = {
            Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
            ContentType: "image/jpeg",
            base64: data
        };

        $titulo = $(e.target).closest('form').find('.js-titulo');

        if (e.context && e.context.disciplinaId) {
            disciplinaId = e.context.disciplinaId;
        } else {
            $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');
            disciplinaId = $disciplina.val();
        }

        dataProvider.Files.create(file, function(response) {
            PublicacoesService.createPublicacao(dataProvider, 'image', null, $titulo.val(), null, null, response.result.Uri, disciplinaId, null, function(pubAdd) {
                $titulo.val('');

                if ($disciplina) {
                    $disciplina.val('');
                }
                
                // REFRESH
                if (!dataSource._data) {
                    dataSource.push(pubAdd);
                } else {
                    dataSource.add(pubAdd);
                }

                var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                console.log(newEl);
                e.context.connectEvent(newEl);
            });
        }, function(err) {
            app.alert("Falha no upload do arquivo: " + err.message);
        });  
    };

    function onPictureError(err) {
        if (!err.toLowerCase().startsWith("selection cancelled")) {
            app.alert("Falha ao carregar imagem!");
        }
    }; 

    PublicacoesService.runCamera(400, 300, onPictureSuccess, onPictureError, {
        destination: navigator.camera.DestinationType.DATA_URL,
        type: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
        media: navigator.camera.MediaType.PICTURE
    });
};

function onMuralFileVideo(e) {
    var $titulo, $disciplina, disciplinaId
        dataProvider = app.data.mackenzie;

    var pub = e.context.pub;
    var ele = e.context.view;
    var dataSource = e.context.dataSource;
    
    function onVideoSuccess(data) {
        try {
            saveFile(data);

            function saveFile(data) {
                var options = {
                    fileName: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".mp4",
                    mimeType: 'video/mp4'
                };

                $titulo = $(e.target).closest('form').find('.js-titulo');

                if (e.context && e.context.disciplinaId) {
                    disciplinaId = e.context.disciplinaId;
                } else {
                    $disciplina = $(e.target).closest('form').find('.js-disciplina-sel');
                    disciplinaId = $disciplina.val();
                }

                dataProvider.Files.upload(data, options)
                    .then(function(data) {
                        data = JSON.parse(data.response);

                        if (data.Result.length > 1) {
                            app.alert("Favor selecionar apenas um arquivo!");
                            return;
                        }

                        data = data.Result[0];

                        PublicacoesService.createPublicacao(dataProvider, 'video', null, $titulo.val(), null, null, data.Uri, disciplinaId, null, function(pubAdd) {
                            $titulo.val('');

                            if ($disciplina) {
                                $disciplina.val('');
                            }
                            
                            // REFRESH
                            if (!dataSource._data) {
                                dataSource.push(pubAdd);
                            } else {
                                dataSource.add(pubAdd);
                            }

                            var newEl = ele.data("kendoMobileListView").prepend([pubAdd]);
                            console.log(newEl);
                            e.context.connectEvent(newEl);
                        });
                }, function(err) {
                    app.alert("Falha no upload do arquivo: " + err.message);
                });   
            };
        } catch(e) {
            app.alert('Error on upload file: '+JSON.stringify(e));  
        };
    };

    function onVideoError(err) {
        if (!err.toLowerCase().startsWith("selection cancelled")) {
            app.alert("Falha ao carregar imagem!");
        }
    }; 

    PublicacoesService.runCamera(400, 300, onVideoSuccess, onVideoError, {
        destination: navigator.camera.DestinationType.NATIVE_URI,
        type: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
        media: navigator.camera.MediaType.VIDEO
    });
};

/*function getMuralDataItem(el) {
    e = {};
    e.currentTarget = el;
    e.li = $(el).closest('[data-uid]');  //$(e).closest('li').parents('li');
    e.data = app.muralView.muralViewModel.get('dataSource').getByUid(e.li.attr('data-uid'));

    return e;
};

function getMuralDisciplinaDataItem(el) {
    e = {};
    e.currentTarget = el;
    e.li = $(el).closest('[data-uid]');

    var uid = e.li.attr('data-uid');
    e.data = app.disciplinasView.disciplinasViewModel.get('publicacoes').find(function(item) {
        return item.uid === uid;
    });

    return e;
}*/