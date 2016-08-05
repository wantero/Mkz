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
            app.mobileApp.navigate('#components/cursosView/view.html');
        }
    });

    function onPictureSuccess(imageData) {
        var file = {
            Filename: Math.random().toString(36).substring(2, 15) + ".jpg",
            ContentType: "image/jpeg",
            base64: imageData,
        };

        dataProvider.Files.create(file, function(response) {
            var fileUri = response.result.Uri;

            var imgEl = document.createElement("img");
            imgEl.setAttribute('src', fileUri);
            imgEl.style.position = "absolute";
            document.body.appendChild(imgEl);
        }, function(err) {
            navigator.notification.alert("Unfortunately the upload failed: " + err.message);
        });
    };

    function onPictureError() {
        navigator.notification.alert("Unfortunately we were not able to retrieve the image");
    };

    parent.set('perfilViewModel', perfilViewModel);
})(app.perfilView);

// START_CUSTOM_CODE_perfilViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
// END_CUSTOM_CODE_perfilViewModel