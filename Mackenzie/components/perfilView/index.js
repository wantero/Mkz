'use strict';

app.perfilView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_perfilView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_perfilView
(function(parent) {
    var perfilViewModel = kendo.observable({
        fields: {
            senha: '',
            email: '',
            nome: '',
            tia: '',
        },
        submit: function() {},
        cancel: function() {}
    });

    parent.set('perfilViewModel', perfilViewModel);
})(app.perfilView);

// START_CUSTOM_CODE_perfilViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_perfilViewModel