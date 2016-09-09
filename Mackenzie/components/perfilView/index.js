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
                var file = {
                    Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
                    ContentType: "image/jpeg",
                    base64: imageData,
                };

                dataProvider.Files.create(file, function(response) {
                    perfilViewModel.fields.fotoUri = response.result.Uri;
                    $('#foto').attr('src', perfilViewModel.fields.fotoUri);
                }, function(err) {
                    navigator.notification.alert("Unfortunately the upload failed: " + err.message);
                });
            };

            function onPictureError() {
                navigator.notification.alert("Unfortunately we were not able to retrieve the image");
            };

            function runCamera(width, height, success, error, type) {
                var cameraConfig = {
                    destinationType: navigator.camera.DestinationType.DATA_URL,
                    targetWidth: width,
                    targetHeight: height,
                    //sourceType: navigator.camera.PictureSourceType.CAMERA
                    //sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                    sourceType: type ? type : navigator.camera.PictureSourceType.CAMERA,
                    mediaType: navigator.camera.MediaType.PICTURE
                };

                navigator.camera.getPicture(success, error, cameraConfig);
            };

            runCamera(400, 300, onPictureSuccess, onPictureError);
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
            $('#foto').attr('src', perfilViewModel.fields.fotoUri);
        }
    })
})(app.perfilView);
