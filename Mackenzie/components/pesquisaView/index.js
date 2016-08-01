'use strict';

var lastCursoFilterValue = '';

app.pesquisaView = kendo.observable({
    onShow: function() {},
    afterShow: function() {},
    filtraPesquisa: function(valueField) {
    	if ($("#cursos").is(":visible")) {
				app.cursosView.cursosViewModel.filtraPesquisa(valueField);
    	} else {
    		app.disciplinasView.disciplinasViewModel.filtraPesquisa(valueField);
    	}
    },
    lastCursoFilter: function(filter) {
			if (filter) {
				lastCursoFilterValue = filter;
			}

			return lastCursoFilterValue;
    }
});

// START_CUSTOM_CODE_pesquisaView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_pesquisaView