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
            alert(msg);
            return false;
        }

        return true;
    },

    verificaDisciplina: function($element) {
        if ($element && (!$element.val() || $element.val() == '')) {
            alert('Favor informar o componente para a publicação!');
            return false;
        }

        return true;
    },

    createPublicacao: function(dataProvider, tipo, texto, titulo, fileName, fileSize, anexoUri, disciplinaId, cb) {
        var dataPublicacoes = dataProvider.data('Publicacoes');

        dataPublicacoes.create(
            {
                'FileName': fileName ? fileName : '',
                'FileSize': fileSize ? fileSize : '',
                'Disciplina': disciplinaId ? disciplinaId : '',
                'Comentarios': [],
                'Likes': [],
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
    },

    updatePublicacao: function(dataProvider, publicacaoId, titulo, disciplinaId, cb) {
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
                            cb();
                        } catch(e) {
                            alert('Error on Update Publicacoes: '+e.message);
                        }
                    }
                }
            },
            function(error){
                alert('Erro ao gravar Publicacoes! '+error.message);
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
	          			alert('CreateComentarios Error: '+e.message);
					}
		    	}
		    },
		    function(error){
		        alert('CreateComentarios Error: '+error.message);
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
							cb(data.result);
						} catch(e) {
							alert('PushLikes Error: '+e.message);
						}
					}
				}
			},
			function (error) {
		    	alert('PushLikes Error: '+error.message);
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
							cb(data.result);
						} catch(e) {
							alert('PushLikes Error: '+e.message);
						}
					}
				}
			},
			function (error) {
		    	alert('PushLikes Error: '+error.message);
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
                            cb(data.result);
                        } catch(e) {
                            alert('PopLikes Error: '+e.message);
                        }
                    }
                }
            },
            function (error) {
                alert('PopLikes Error: '+error.message);
            }
        );
    },

    populateDisciplinasHtml: undefined,
    populateDisciplinas: function($disciplinasSelect, cb) {
        var dataProvider = app.data.mackenzie;

        function getCursos($disciplinasSelect, cb) {
            var queryCursos = new Everlive.Query();
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
                    alert('Error loading data (Cursos)');
                });
        };

        function getDisciplinas($disciplinasSelect, cursos, cb) {
            var queryDisciplinas = new Everlive.Query();
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
                    alert('Erro loading data (Disciplinas)');
                });
        };

        function setHtml($disciplinasSelect, html, cb) {
            $disciplinasSelect.html(html);

            if (cb) {
                try {
                    cb();
                } catch(e) {
                    alert('Error getDisciplinas/PublicacoesService: '+e.message);
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
                PublicacoesService.createPublicacao(dataProvider, 'image', null, $titulo.val(), null, null, response.result.Uri, disciplinaId, function() {
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

    runCamera: function(width, height, success, error) {
        var cameraConfig = {
            destinationType: navigator.camera.DestinationType.DATA_URL,
            targetWidth: width,
            targetHeight: height,
            //sourceType: navigator.camera.PictureSourceType.CAMERA
            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
            mediaType: navigator.camera.MediaType.ALLMEDIA
        };

        navigator.camera.getPicture(success, error, cameraConfig);
    },

    runFile: function() {

    }
};

function onMuralPublicacaoReply(e) {
    var pub = e.context;
    var dataProvider = app.data.mackenzie;

    PublicacoesService.createPublicacao(dataProvider, pub.Tipo, pub.Texto, pub.Titulo, pub.FileName, pub.FileSize, pub.AnexoUri, pub.Disciplina);
}

function onMuralPublicacaoUpdate(e) {
    var pub = e.context;
    var updateMural = e.target.closest('ul').parent().closest('ul').find('#update-mural-publicacoes');

    var disciplinasSelect = updateMural.find('#mural-disciplina-update-select');
    var tituloPub = updateMural.find('#tituloCompartilharUpdate');

    PublicacoesService.populateDisciplinas(disciplinasSelect, function() {    
        tituloPub.val(pub.Titulo);
        disciplinasSelect.val(pub.Disciplina);    
        updateMural.show();
    });
}
