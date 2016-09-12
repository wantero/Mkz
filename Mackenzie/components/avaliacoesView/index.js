'use strict';

app.avaliacoesView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

(function(parent) {    
    var viewParam = "";
    var dataProvider = app.data.mackenzie,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('avaliacoesViewModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }

            avaliacoesViewModel.lastDisciplina = "";
        },
        processImage = function(img) {
            function isAbsolute(img) {
                if  (img && (img.slice(0,  5)  ===  'http:' || img.slice(0,  6)  ===  'https:' || img.slice(0,  2)  ===  '//'  ||  img.slice(0,  5)  ===  'data:')) {
                    return true;
                }
                return false;
            }

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (!isAbsolute(img)) {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },
        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            transport: {
                read: function(options) {
                    //$('#avaliacoesData').hide();

                    loadAvaliacoes(null, function(data) {
                        //avaliacoesViewModel.set('dataSource', data);
                        options.success(data);
                        //$('#avaliacoesData').show();
                    });                    
                }
            },
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },
            error: function(e) {
                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'Titulo': {
                            field: 'Titulo',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        avaliacoesViewModel = kendo.observable({
            dataSource: dataSource,
            fixHierarchicalData: function(data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                if (result.Disciplina) {
                    result.showDisciplina = false;

                    if (avaliacoesViewModel.lastDisciplina != result.Disciplina.Id) {
                        result.showDisciplina = true;
                        avaliacoesViewModel.lastDisciplina = result.Disciplina.Id;
                    }
                }

                if (!result.Respostas) {
                    result.Respostas = { Pontos: 0 };
                }

                return result;
            },
            itemClick: function(e) {
                var dataItem = dataSource.getByUid(e.data.uid); // || avaliacoesViewModel.originalItem;

                avaliacoesViewModel.setCurrentItemByUid(dataItem.uid);

                avaliacoesViewModel.loadQuestoesAvaliacao(dataItem.Id, function(questoes) {
                    avaliacoesViewModel.set('currentItemQuestoes', questoes);
                    app.mobileApp.navigate('#components/avaliacoesView/details.html?uid=' + dataItem.uid);
                });
            },
            jaRealizadoClick: function(e) {
                var dataItem = dataSource.getByUid(e.data.uid);

                avaliacoesViewModel.setCurrentItemByUid(dataItem.uid);  
                
                avaliacoesViewModel.loadQuestoesAvaliacao(dataItem.Id, function(questoes) {
                    //avaliacoesViewModel.set('currentItemQuestoes', questoes);
                    avaliacoesViewModel.loadRespostasAvaliacao(questoes, dataItem.Id, function(questoes) {
                        avaliacoesViewModel.set('currentItemRespostas', questoes);

                        var totalPontos = calculaTotalPontos(questoes);
                       /* for (var i=0; i < questoes.length; i++) {
                            if (questoes[i].OpcaoCorreta == questoes[i].Resposta) {
                                totalPontos ++;
                            }
                        }*/

                        var currentItem = avaliacoesViewModel.get('currentItem');
                        currentItem.TotalPontos = totalPontos;
                        avaliacoesViewModel.set('currentItem', avaliacoesViewModel.fixHierarchicalData(currentItem));

                        console.log('currentItem', currentItem);

                        app.mobileApp.navigate('#components/avaliacoesView/result.html?uid=' + dataItem.uid);
                    });
                });
            },
            avaliacoesClose: function() {
                $('#appDrawer').data('kendoMobileDrawer').show();
            },
            enviarRepostas: function(e) {
                function addResposta() {
                    var dataRespostas = dataProvider.data('RespostasAvaliacao');
                    dataRespostas.create({
                            'Pontos': pontos,
                            'Avaliacao': avaliacao.Id,
                            'User': app.getUserData().Id
                        },
                        function(data){
                            addRespostaQuestao(0, data.result.Id, function() {
                                avaliacoesViewModel.set('currentItem', avaliacoesViewModel.fixHierarchicalData(avaliacao));
                                avaliacoesViewModel.set('currentItemRespostas', questoes);
                                
                                app.mobileApp.navigate('#components/avaliacoesView/result.html?uid='+avaliacao.uid);
                            });
                        },
                        function(error){
                            alert('Error writing data (RespostasAvaliacao)');
                        });
                };

                function addRespostaQuestao(index, idRespostaAvaliacao, cb) {
                    if (questoes.length > index) {
                        var questao = questoes[index];

                        var dataQuestoes = dataProvider.data('RespostaQuestaoAvaliacao');
                        dataQuestoes.create({
                                'Pontos': pontos,
                                'Resposta': questao.Resposta,
                                'RespostaCorreta': questao.OpcaoCorreta,
                                'Questao': questao.Id,
                                'RespostaAvaliacao': idRespostaAvaliacao
                            },
                            function(data){
                                addRespostaQuestao(index+1, idRespostaAvaliacao, cb);
                            },
                            function(error){
                                alert('Error writing data (RespostaQuestaoAvaliacao)');
                            });
                    } else {
                        if (cb) {
                            try {
                                cb();
                            } catch(err) {
                                alert('AddRespostaQuestao Error: '+err.message);
                            }
                        }
                    }
                };

                var form = $('#questionario');
                var avaliacao = avaliacoesViewModel.get('currentItem');
                var questoes = avaliacoesViewModel.get('currentItemQuestoes');
                var pontos = 0;

                for (var i=0; i < questoes.length; i++) {
                    var questao = questoes[i];                    
                    var resposta = form.find('[name='+questoes[i].PerguntaId+']:checked');

                    questao.Resposta = resposta.val();

                    if (questao.OpcaoCorreta == questao.Resposta) {
                        pontos += questao.Pontos;
                    }

                    avaliacao.TotalPontos = pontos;
                }

                addResposta();
            },
            respostasOk: function(e) {
                $('#avaliacoesDetailView').html('');

                var model = avaliacoesViewModel.get('currentItem');
                var flow = model.Flow;
                model.Flow = undefined;

                if (flow && flow == 'avaliacoes') {
                    app.mobileApp.navigate('#components/avaliacoesView/view.html');
                } else {
                    app.cursosView.cursosViewModel.avaliacoesBack(e);
                }
            },
            detailsShow: function(e) {
                app.displayUser();        

                avaliacoesViewModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = avaliacoesViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel) {
                    alert('Error loading data (Avaliacoes)');
                    return;
                }

                avaliacoesViewModel.set('originalItem', itemModel);

                itemModel.Flow = 'avaliacoes';                    
                avaliacoesViewModel.set('currentItem',
                    avaliacoesViewModel.fixHierarchicalData(itemModel));


                return itemModel;
            },
            disciplinaClick: function(e) {
                app.disciplinasView.disciplinasViewModel.set('currentDisciplina', e.dataItem);
                app.mobileApp.navigate('#components/disciplinasView/details.html?uid=' + e.dataItem.uid);
            },
            detailOption: function(e) {
                if (e.currentTarget.id === 'btDisciplinas') {
                    $('#disciplinas').show().siblings().hide();
                } else {
                    $('#agenda').show().siblings().hide();
                    avaliacoesViewModel.selectDiaView();
                }
            },
            linkBind: function(linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function(imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            filtraPesquisa: function(valueField) {
                if (viewParam === null) {
                    var param = [{ field: "Curso", operator: "contains", value: valueField }];
                } else {
                    var param = [viewParam, { field: "Curso", operator: "contains", value: valueField }];
                }        

                fetchFilteredData(param);
            },
            currentItem: {},
            lastDisciplina: "",
            loadAvaliacoes: function(param, done) {
                loadAvaliacoes(param, done);
            },
            loadQuestoesAvaliacao: function(id, done) {
                var query = new Everlive.Query();
                query.where().eq('Avaliacao', id);
                query.expand({"Opcoes": true});
                query.order('Ordem');

                var data = dataProvider.data('QuestoesAvaliacao');
                data.get(query)
                    .then(function(data) {
                        for (var i=0; i < data.result.length; i++) {
                            data.result[i].PerguntaId = 'P'+i;

                            if (data.result[i].Opcoes.length) {
                                data.result[i].Opcoes.sort(function(a, b) {
                                    return a.Ordem - b.Ordem;
                                });
                            }
                        }

                        try {
                            done(data.result);    
                        } catch(err) {
                            alert('LoadQuestoesAvaliacao Error: '+err.message);
                        }                        
                    },
                    function(error){
                        alert('Error loading data (Questoes)');
                    });
            },
            loadRespostasAvaliacao: function(questoes, idAvaliacao, cb) {
                getRespostasAvaliacao(idAvaliacao, cb);

                function getRespostasAvaliacao(idAvaliacao, cb) {
                    var queryRespostasAvaliacao = new Everlive.Query();
                    queryRespostasAvaliacao.where()
                        .and()
                            .eq('User', app.getUserData().Id)
                            .eq('Avaliacao', idAvaliacao);
                    //queryRespostasAvaliacao.expand({"Avaliacao": true});

                    var dataRespostasAvaliacao = dataProvider.data('RespostasAvaliacao');
                    dataRespostasAvaliacao.get(queryRespostasAvaliacao)
                        .then(function(data) {
                            if (!data.result && !data.result.length) {
                                alert('Error loading data (RespostasAvaliacao)');
                                return;
                            }

                            getRespostaQuestaoAvaliacao(questoes, data.result ? data.result[0] : undefined, cb);
                        }, function(err) {
                            alert('Error loading data (Cursos)');
                        });
                }

                function getRespostaQuestaoAvaliacao(questoes, respostasAvaliacao, cb) {
                    var queryRespostaQuestaoAvaliacao = new Everlive.Query();
                    queryRespostaQuestaoAvaliacao.where().eq('RespostaAvaliacao', respostasAvaliacao ? respostasAvaliacao.Id : undefined);

                    var dataRespostaQuestaoAvaliacao = dataProvider.data('RespostaQuestaoAvaliacao');
                    dataRespostaQuestaoAvaliacao.get(queryRespostaQuestaoAvaliacao)
                        .then(function(data) {
                            if (!data.result && !data.result.length) {
                                alert('Error loading data (RespostaQuestaoAvaliacao)');
                                return;
                            }
                            
                            var avaliacao = avaliacoesViewModel.get('currentItem');
                            avaliacao.Flow = 'jarealizado';

                            var today = new Date();
                            
                            today.setHours(0);
                            today.setMinutes(0);
                            today.setSeconds(0); 

                            avaliacao.Situacao = 'realizado';

                            if (avaliacao.Expiracao.toString() === today.toString()) {
                                avaliacao.Situacao = 'valido';
                            } else if (avaliacao.Expiracao < today) {
                                avaliacao.Situacao = 'expirado';
                            } else if (avaliacao.Expiracao > today) {
                                avaliacao.Situacao = 'valido';
                            }

                            console.log("Avaliação situação: ", avaliacao.Situacao);

                            var respostas = data.result;
                            //var questoes = avaliacoesViewModel.get('currentItemQuestoes');
                            var pontos = 0;

                            for (var i=0; i < questoes.length; i++) {
                                for (var k=0; k < respostas.length; k++) {
                                    questoes[i].SituacaoAvaliacao = avaliacao.Situacao.toLowerCase();

                                    if (questoes[i].Id == respostas[k].Questao) {
                                        questoes[i].Resposta = respostas[k].Resposta;
                                        break;
                                    }
                                }

                                if (questoes[i].OpcaoCorreta == questoes[i].Resposta) {
                                    pontos += questoes[i].Pontos;
                                }
                            }

                            avaliacao.TotalPontos = pontos;
                            avaliacoesViewModel.set('currentItem', avaliacao);

                            if (cb) {
                                try {                                    
                                    cb(questoes);
                                } catch(err) {
                                    alert('GetRespostaQuestaoAvaliacao Error: '+err.message);
                                }
                            }
                        }, function(err) {
                            alert('Error loading data (Cursos)');
                        });
                }
            }
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('avaliacoesViewModel', avaliacoesViewModel);
        });
    } else {
        parent.set('avaliacoesViewModel', avaliacoesViewModel);
    }

    
    function calculaTotalPontos(questoes) {
        var totalPontos = 0;

        for (var i=0; i < questoes.length; i++) {
            if (questoes[i].OpcaoCorreta == questoes[i].Resposta) {
                totalPontos ++;
            }
        }

        return totalPontos;
    }

    function loadAvaliacoes(param, done) {
        var responsebody = [];
        var respostas = [];

        if (!param) {
            getCursos();
        } else {
            var disciplinas = [param];
            getRespostasAvaliacao(disciplinas);
        }

        function getCursos() {
            var queryCursos = new Everlive.Query();
            queryCursos.where().eq('Users', app.getUserData().Id);

            var dataCursos = dataProvider.data('Cursos');
            dataCursos.get(queryCursos)
                .then(function(data) {
                    var cursos = [];
                    for (var i=0; i < data.result.length; i++) {
                        cursos.push(data.result[i].Id);
                    }

                    getDisciplinas(cursos);
                }, function(err) {
                    alert('Error loading data (Cursos)');
                });
        }

        function getDisciplinas(cursos) {
            var queryDisciplinas = new Everlive.Query();
            queryDisciplinas.where().isin('Cursos', cursos);

            var dataDisciplinas = dataProvider.data('Disciplinas');
            dataDisciplinas.get(queryDisciplinas)
                .then(function(data){
                    if (data.result) {                
                        var disciplinas = [];

                        for (var i = 0; i < data.result.length; i++) {
                            disciplinas.push(data.result[i].Id);   
                        }
                    
                        getRespostasAvaliacao(disciplinas);
                    }
                }, function(Err) {
                    alert('Erro loading data (Disciplinas)');
                });
        }

        function getRespostasAvaliacao(disciplinas) {
            var queryRespostas = new Everlive.Query();
            queryRespostas.where().eq('User', app.getUserData().Id);

            var dataRespostas = dataProvider.data('RespostasAvaliacao');
            dataRespostas.get(queryRespostas)
                .then(function(data){
                    if (data.result) {  
                        respostas = data.result;              
                        getAvaliacoes(disciplinas, respostas);
                    }
                }, function(Err) {
                    alert('Erro loading data (Disciplinas)');
                });
        }

        function findResposta(avaliacaoId) {
            for (var i=0; i < respostas.length; i++) {
                if (respostas[i].Avaliacao && respostas[i].Avaliacao == avaliacaoId) {
                    return true;
                }
            }

            return false;
        }

        function getAvaliacoes(disciplinas, respostas) {
            var queryAvaliacoes = new Everlive.Query();
            queryAvaliacoes.where().isin('Disciplina', disciplinas);
            queryAvaliacoes.expand({"Disciplina": true});

            var dataAvaliacoes = dataProvider.data('Avaliacoes');
            dataAvaliacoes.get(queryAvaliacoes)
                .then(function(data) {
                    var professores = [];
                    var today = new Date();
                    
                    today.setHours(0);
                    today.setMinutes(0);
                    today.setSeconds(0);
                    
                    for (var i = 0; i < data.result.length; i++) {
                        var item = data.result[i];

                        for (var k=0; k < respostas.length; k++) {
                            if (item.Id == respostas[k].Avaliacao) {
                                item.Respostas = respostas[k];
                            }
                        }

                        if (item.Disciplina.Professor !== "") {
                            professores.push(item.Disciplina.Professor);   
                        } else {
                            item.Disciplina.Professor = {Nome: ""};
                        }

                        /*if (findResposta(item.Id)) {
                            item.ExpiracaoText = '';
                            item.Situacao = 'realizado';
                        } else {
                            if (item.Expiracao.toString() === today.toString()) {
                                item.ExpiracaoText = 'Hoje';
                                item.Situacao = 'valido';
                            } else if (item.Expiracao < today) {
                                item.ExpiracaoText = 'Expirado';
                                item.Situacao = 'expirado';
                            } else if (item.Expiracao > today) {
                                var dias = (((Date.parse(item.Expiracao)) - (Date.parse(today))) / (24 * 60 * 60 * 1000));
                                item.ExpiracaoText = 'Expira em '+dias+' dia(s)';
                                item.Situacao = 'valido';
                            }
                        }*/


                        if (item.Expiracao.toString() === today.toString()) {
                            item.ExpiracaoText = 'Hoje';
                            item.Situacao = 'valido';
                        } else if (item.Expiracao < today) {
                            item.ExpiracaoText = 'Expirado';
                            item.Situacao = 'expirado';
                        } else if (item.Expiracao > today) {
                            var dias = (((Date.parse(item.Expiracao)) - (Date.parse(today))) / (24 * 60 * 60 * 1000));
                            item.ExpiracaoText = 'Expira em '+dias+' dia(s)';
                            item.Situacao = 'valido';
                        }

                        if (findResposta(item.Id)) {
                            //item.ExpiracaoText = '';
                            item.Situacao = 'realizado';
                        }
                    }

                    responsebody = data.result;

                    getProfessores(professores);
                }, function (err) {
                    alert('Error loading data (Avaliacoes)');
                });
        }

        function getProfessores(professores) {
            var queryProfessores = new Everlive.Query();
            queryProfessores.where().isin('Id', professores);
            queryProfessores.expand({"User": true});

            var dataProfessores = dataProvider.data('Professores');
            dataProfessores.get(queryProfessores)
                .then(function(data) {                                
                    for (var i = 0; i < responsebody.length; i++) {
                        var professorId = responsebody[i].Disciplina.Professor;
                        
                        if (professorId !== "") {
                            for (var x = 0; x < data.result.length; x ++) {
                                if (professorId == data.result[x].Id) {
                                    responsebody[i].Disciplina.Professor = data.result[x];
                                }
                            }
                        }                        
                    }

                    try {
                        done(responsebody);    
                    } catch(err) {
                        alert('GetProfessores Error: '+err.message);
                    }                    
                }, function (err) {
                    alert('Error loading data (Professores)');
                });
        }
    }


    /*parent.set('onInit', function(e) {
        avaliacoesViewModel.set('avaliacoes', []);
    });*/

    parent.set('onShow', function(e) {
        e.view.element.find('#main-header-quiz').show().siblings().hide();        
        e.view.element.find('#quizClose').click(function() {
            $('#appDrawer').data('kendoMobileDrawer').show();
        });

        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        app.displayUser();

        /*loadAvaliacoes(null, function(data) {
            avaliacoesViewModel.set('dataSource', data);
        });*/

        // Armazena o parametro recebido pela VIEW
        viewParam = param;

        fetchFilteredData(viewParam);
    });

    parent.set('onDetailShow', function(e) {
        app.displayUser();
        e.view.element.find('#main-header-quiz-detail').show().siblings().hide();        
    });

    parent.set('onDetailAfterShow', function(e) {
        $('#avaliacoesData').show();

        var parent = $('#formQuestionario');

        parent.find('.km-radio, #formQuestionario .km-radio-label').each(function(index, item) {
            $(item).removeAttr('disabled');
        });

        var questoes = avaliacoesViewModel.get('currentItemQuestoes');

        for (var i=0; questoes && i < questoes.length; i++) {
            parent.find('#'+questoes[i].PerguntaId+'-OP-Q-'+questoes[i].Resposta).attr('checked', true);
        }
    });

    parent.set('onResultadoShow', function(e) {
        app.displayUser();
        e.view.element.find('#main-header-quiz-resultado').show().siblings().hide();        

        var parent = $('#resultadoQuestionario');

        parent.find('.km-radio, .km-radio-label').each(function(index, item) {
            $(item).attr('disabled', true);
        });

        var questoes = avaliacoesViewModel.get('currentItemRespostas');

        for (var i=0; questoes && i < questoes.length; i++) {
            parent.find('#'+questoes[i].PerguntaId+'-OP-R-'+questoes[i].Resposta).attr('checked', true);
        }

        var avaliacao = avaliacoesViewModel.get('currentItem');
        if (avaliacao.Flow && avaliacao.Flow.toLowerCase() == 'jarealizado') {
            e.view.element.find('#resultOkButton').hide();
            e.view.element.find('#resultBackButton').show();
        } else {
            e.view.element.find('#resultOkButton').show();
            e.view.element.find('#resultBackButton').hide();
        }
    });    

})(app.avaliacoesView);
