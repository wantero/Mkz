'use strict';

app.perfilView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {
    var dataProvider = app.data.mackenzie;

    var perfilViewModel = kendo.observable({
        fields: {
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
            $("#imageActions").data("kendoMobileActionSheet").open();
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
            $('#foto').get(0).style.backgroundImage = "url("+perfilViewModel.fields.fotoUri+")";
        }
    });

})(app.perfilView);

function editarPerfilOnCamera() {
  function onPictureSuccess(data) {
    var file = {
      Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
      ContentType: "image/jpeg",
      base64: data
    };

    app.data.mackenzie.Files.create(file, function(response) {
      app.perfilView.perfilViewModel.fields.fotoUri = response.result.Uri;
      $('#foto').get(0).style.backgroundImage = "url("+app.perfilView.perfilViewModel.fields.fotoUri+")";
    }, function(err) {
      navigator.notification.alert("Unfortunately the upload failed: " + err.message);
    });  
  };

  function onPictureError(e) {
    if (!e.toLowerCase().startsWith("camera cancelled")) {
        navigator.notification.alert("Falha no acesso à camera!");
    }
  };

  PublicacoesService.runCamera(400, 300, onPictureSuccess, onPictureError, {
    destination: navigator.camera.DestinationType.DATA_URL,
    type: navigator.camera.PictureSourceType.CAMERA,
    media: navigator.camera.MediaType.PICTURE
  });
};

function editarPerfilOnDocumentos() {
  function onVideoSuccess(data) {
    var file = {
      Filename: '\\tmp\\'+Math.random().toString(36).substring(2, 15) + ".jpg",
      ContentType: "image/jpeg",
      base64: data
    };

    app.data.mackenzie.Files.create(file, function(response) {
      app.perfilView.perfilViewModel.fields.fotoUri = response.result.Uri;
      $('#foto').get(0).style.backgroundImage = "url("+app.perfilView.perfilViewModel.fields.fotoUri+")";
    }, function(err) {
      navigator.notification.alert("Unfortunately the upload failed: " + err.message);
    });  
  };

  function onVideoError(e) {
    if (e.toLowerCase().startsWith("selection cancelled")) {
      navigator.notification.alert("Falha ao carregar imagem!");
    }
  }; 

  PublicacoesService.runCamera(400, 300, onVideoSuccess, onVideoError, {
    destination: navigator.camera.DestinationType.DATA_URL,
    type: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
    media: navigator.camera.MediaType.PICTURE
  });
};


// Imagem original do usuario '1'
// https://bs2.cdn.telerik.com/v1/kb8omb79mcfcupp9/34dbe970-7ba0-11e6-a44f-01775a8a3bf5?1473983875167