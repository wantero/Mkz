'use strict';

app.perfilView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_perfilView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
// END_CUSTOM_CODE_perfilView


(function(parent) {
    var dataProvider = app.data.mackenzie;

    var perfilViewModel = kendo.observable({
        fields: {
            senha: '',
            email: '',
            nome: '',
            tia: '',
            fotoUri: '',
            id: ''
        },
        submit: function() {
            //pictureSource=navigator.camera.PictureSourceType;
            //destinationType=navigator.camera.DestinationType;

            var cameraConfig = {
                destinationType: navigator.camera.DestinationType.DATA_URL,
                targetWidth: 400,
                targetHeight: 300,
                sourceType: navigator.camera.PictureSourceType.CAMERA
            };
            
            navigator.camera.getPicture(onPictureSuccess, onPictureError, cameraConfig);
        },
        cancel: function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        },
        editarFoto: function() {
            var cameraConfig = {
                destinationType: navigator.camera.DestinationType.DATA_URL,
                targetWidth: 400,
                targetHeight: 300,
                sourceType: navigator.camera.PictureSourceType.CAMERA
            };

            navigator.camera.getPicture(onPictureSuccess, onPictureError, cameraConfig);
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
                            app.showMessage('<b>Perfil alterado com sucesso.</b>'+
                                            '<br><br>Para alterar a senha você precisará acessar sua caixa de e-mail e seguir as instruções enviadas.', app.perfilView.perfilViewModel.onAfterEnviar);
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

    parent.set('perfilViewModel', perfilViewModel);

    parent.set('onShow', function() {
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

            $('#editarPerfilClose').click(function() {
                $('#appDrawer').data('kendoMobileDrawer').show();
            });

    })
})(app.perfilView);

// START_CUSTOM_CODE_perfilViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
// END_CUSTOM_CODE_perfilViewModel