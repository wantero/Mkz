'use strict';

app.perfilView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {
    var dataProvider = app.data.mackenzie;

    var perfilViewModel = kendo.observable({
        fields: {
            //senha: '',
            email: '',
            nome: '',
            tia: '',
            fotoUri: '',
            id: ''
        },
        cancel: function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        },
        editarFoto: function() {
            function onPictureSuccess(imageData) {
                /*teste(imageData);
                alert(imageData);
                
                $.get(imageData, function(res) {
                    alert("index.html ["+res+"]");
                });*/

                fileChooser.open(
                  function(a) {
                    alert(a);
                  , function(b) {
                    alert(b);
                  });

                var file = {
                    Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
                    ContentType: "image/jpeg",
                    base64: imageData
                    //base64: kendo.util.encodeBase64(res)
                };

                alert('1b');
                dataProvider.Files.create(file, function(response) {
                    perfilViewModel.fields.fotoUri = response.result.Uri;
                    //$('#foto').attr('src', perfilViewModel.fields.fotoUri);
                    $('#foto').get(0).style.backgroundImage = "url("+perfilViewModel.fields.fotoUri+")";
                    //$('#foto').attr('src', 'data:image/png;base64,'+perfilViewModel.fields.fotoUri);
                }, function(err) {
                    navigator.notification.alert("Unfortunately the upload failed: " + err.message);
                });  
            };

            function onPictureError() {
                navigator.notification.alert("Unfortunately we were not able to retrieve the image");
            };

            function runCamera(width, height, success, error, options) {
                var cameraConfig = {
                    targetWidth: width,
                    targetHeight: height,
                    destinationType: options.destination != undefined  ? options.destination : navigator.camera.DestinationType.DATA_URL,
                    sourceType: options.type != undefined ? options.type : navigator.camera.PictureSourceType.CAMERA,
                    mediaType: options.media != undefined  ? options.media : navigator.camera.MediaType.PICTURE
                };
                
                //alert(JSON.stringify(cameraConfig));
                navigator.camera.getPicture(success, error, cameraConfig);
            };

            runCamera(400, 300, onPictureSuccess, onPictureError, {
                //destination: navigator.camera.DestinationType.FILE_URI,
                type: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                media: navigator.camera.MediaType.ALLMEDIA
            });
        },
        enviar: function() {
            dataProvider.Users.updateSingle(
                {
                    'Id': perfilViewModel.fields.id,
                    'Email': perfilViewModel.fields.email,
                    'DisplayName': perfilViewModel.fields.nome,
                    'fotoUri': perfilViewModel.fields.fotoUri
                },
                function(data){
                    dataProvider.Users.currentUser().then(
                        function(user) {
                            app.user.data = user.result;
                            app.showMessage('<b>Perfil alterado com sucesso.</b>', app.perfilView.perfilViewModel.onAfterEnviar);
                        },
                        function(error) {
                            console.log('error:', error);
                        });
                },
                function(error){
                    console.log('error on update user');
                }
            );
        },
        onAfterEnviar: function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        }
    });

    parent.set('perfilViewModel', perfilViewModel);

    parent.set('onShow', function(e) {
        var data = app.getUserData();
        app.displayUser();

        e.view.element.find('#main-header-perfil').show().siblings().hide();        
        e.view.element.find('#editarPerfilClose').click(function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        });

        var data = app.getUserData();
        app.displayUser();

        if (app && app.user) {
            if (app.user.data) {
                data = app.user.data;
            } else {
                data = app.user;
            }
        }

        perfilViewModel.fields.id = data.Id;
        perfilViewModel.fields.tia = data.tia;
        perfilViewModel.fields.nome = data.DisplayName;
        perfilViewModel.fields.email = data.Email;
        perfilViewModel.fields.fotoUri = data.fotoUri;

        $('#tia').text(perfilViewModel.fields.tia);
        $('#nome').val(perfilViewModel.fields.nome);
        $('#email').val(perfilViewModel.fields.email);
        if (perfilViewModel.fields.fotoUri) {
            //$('#foto').attr('src', perfilViewModel.fields.fotoUri);
            $('#foto').get(0).style.backgroundImage = "url("+perfilViewModel.fields.fotoUri+")";
        }
    });

    /*function teste(fileURI) {
        
          function gotFS(fileSystem) {
              alert('file fullpath: ' + fileURI);
              alert('filesystem URL: ' + fileSystem.root.toURL());
              window.resolveLocalFileSystemURL(fileURI, function(fileEntry) {
                    fileEntry.file(function(fileObj) {

                        alert(JSON.stringify(fileObj));
                        newimageURI = fileObj.localURL;
                        alert(newimageURI);

                          fileSystem.root.getFile(fileURI, {create: false}, gotFileEntry, fail);

                    },
                    function(error) {
                      alert('get fileEntry error: ' + error.message);  
                    });
                  },
                  function(error) {
                    alert('resolve error: ' + error.message);
                  });
          }

          function gotFileEntry(fileEntry) {
            alert('got fileentry');
            fileEntry.file(gotFile, fail);
          }

          function gotFile(file){
            alert('got file');
            resizeFile(file);
          }

          function readDataUrl(file) {
              var reader = new FileReader();
              reader.onloadend = function(evt) {
                  console.log("Read as data URL");
                  console.log(evt.target.result);
              };
              reader.readAsDataURL(file);
          }

          function fail(error) {
              alert(error.code + ': ' + error.message);
          }

          function resizeFile(file) {
            alert('resize initiated');
            var reader = new FileReader();
            reader.onloadend = function(evt) {         
              alert('read data: ' + evt.target.result);
              var tempImg = new Image();
              tempImg.src = file;
              tempImg.onload = function() {

                  var MAX_WIDTH = 250;
                  var MAX_HEIGHT = 250;
                  var tempW = tempImg.width;
                  var tempH = tempImg.height;
                  if (tempW > tempH) {
                      if (tempW > MAX_WIDTH) {
                         tempH *= MAX_WIDTH / tempW;
                         tempW = MAX_WIDTH;
                      }
                  } else {
                      if (tempH > MAX_HEIGHT) {
                         tempW *= MAX_HEIGHT / tempH;
                         tempH = MAX_HEIGHT;
                      }
                  }

                  var canvas = document.createElement('canvas');
                  canvas.width = tempW;
                  canvas.height = tempH;
                  var ctx = canvas.getContext("2d");
                  ctx.drawImage(this, 0, 0, tempW, tempH);
                  var dataURL = canvas.toDataURL("image/jpeg");

                  alert('image: ' + JSON.stringify(dataURL));
                }
              }
              reader.readAsDataURL(file);
          }

        alert('teste');
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
    }*/
})(app.perfilView);
