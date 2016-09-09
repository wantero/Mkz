var PublicacoesService = {
	verificaTitulo: function($element, msg) {
        if ($element && $element.val() == '') {
            alert(msg); //'Favor informar o titulo da publicacao!');
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

    cameraPub: function(dataProvider, tituloId, disciplinaId) {
        var $titulo;

        function onPictureSuccess(imageData) {
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

        PublicacoesService.runCamera(400, 300, onPictureSuccess, onPictureError);  
    },

    runCamera: function(width, height, success, error) {
        var cameraConfig = {
            destinationType: navigator.camera.DestinationType.DATA_URL,
            targetWidth: width,
            targetHeight: height,
            sourceType: navigator.camera.PictureSourceType.CAMERA
        };

        navigator.camera.getPicture(success, error, cameraConfig);
    }
}