var MkzDataService = (function() {

	var service = {};
	var _status = '';


	// Private Params
	var _unidade;
	var _tia;
	var _password;

	// Private Data
	var _unidades = []
	var _user = []
	var _cursos = [];
	var _horarios = [];
	var _disciplinas = [];

	var _dias = ['','','segunda','terca','quarta','quinta','sexta','sabado'];


	// Private Methods
    function init() {
    	service.status('loading');

    	service.loadUnidades(function() {
	    	service.status('ready');
    	});
    };

    function transformUnidades(unidades) {
    	// Verificar o envio dos dados (Charset do serviço do mackenzie)
    	for (var index in unidades) {
    		var unidade = unidades[index];
    		unidade.nome_unidade = unidade.nome_unidade.replace('�', 'a');
    	}

    	return unidades;
    };

    function transformUser(user) {
    	if (user) {
    		// Popula disciplinas
    		if (user.componente) {
    			var hoje = new Date();

    			for (var ih in user.componente) {
    				var componente = user.componente[ih];
    				var disciplina = {};

					var found = _disciplinas.find(function(item) {
					    return item.Id === componente.cod_componente;
					});

					if (!found) {
						disciplina.Nome = componente.nome_componente;
						disciplina.Id = componente.cod_componente;

						disciplina.Professor = {
							Nome: componente.nome_professor,
							Unidade: componente.predio,
							Turma: componente.turma,
							Sala: componente.sala
						}

						function generateColor() {
							function randomColor() {
								return ('00'+(Math.floor((Math.random() * 255) + 1)).toString(16)).substr(-2);
							}

							return '#'+randomColor()+randomColor()+randomColor();
						}

						disciplina.color = generateColor();						
						while (disciplina.color.toLowerCase() === '#FFFFFF') {
							disciplina.color = generateColor();
						}
						//console.log(disciplina.Nome+':color: ', disciplina.color);

						_disciplinas.push(disciplina);
					}

					var horario = {};

					function createDate(hora) {
						return new Date(2016, 01, 01, hora.substr(0,2), hora.substr(3,2), 0);
					}

					horario.dia = _dias[componente.dia];
					horario.HorarioInicio = createDate(componente.hora);
					horario.HorarioFim = new Date(horario.HorarioInicio.getTime()+(1000*60*45));
					horario.Disciplina = (!found ? disciplina : found);

					_horarios.push(horario);
    			}
    		}

    		// Popula Curso
			var item = {};

    		item.Duracao = user.duracao ? user.duracao : 8,
			item.Curso = user.nome_curso_aluno,
			item.Id = user.cod_curso_aluno;

			item.Disciplinas = _disciplinas;

			_cursos.push(item);

    		// Popula User
			_user.Id = user.cod_aluno;
			_user.Username = _unidade+'.'+_tia;
			_user.tia = _tia;
			_user.DisplayName = user.nome_aluno;
			_user.Tipo = user.tipo;
    	}

    	return _user;
    };
    function transformCursos(cursos) {
    	return cursos;
    };
    function transformHorarios(horarios) {
    	return horarios;
    };


	// Public Methods
	service.status = function(status) {
		if (status) {
			_status = status;
		}

		return _status;
	};

	service.waitForReady = function(cb) {
		var wait = function() {
			if (service.status() === 'ready') {
				try {
					cb();
				} catch(err) {
					alert('Data Service Error:'+err);
				}
				return;
			}

			setTime();
		};

		function setTime() {
			setTimeout(wait, 100);
		}

		setTime();
	};

	service.unidade = function(unidade) {
		if (unidade) {
			_unidade = unidade;
		}

		return _unidade;
	};

	service.tia = function(tia) {
		if (tia) {
			_tia = tia;
		}

		return _tia;
	};

	service.password = function(password) {
		if (password) {
			_password = password;
		}

		return _password;
	};

	service.loadAllData = function(cb) {
		try {
			if (cb) {
				cb(_unidades);
			}
		} catch(err) {
			app.alert('Error on load Data: '+err);
		}
	};

	service.loadUnidades = function(cb) {
		var url = "https://www3.mackenzie.com.br/tia/tia_mobile/progress/EXT_unidades.php"
			data = {};

		$.post(url, data)
        	.done(
        		function(data) {
            		_unidades = transformUnidades(data.resposta);

        			try {
        				if (cb) {
        					cb(_unidades);
        				}
        			} catch(err) {
        				app.alert('Error on load User: '+err);
        			}
				});
	};

	service.loadUser = function(unidade, tia, password, cb) {
		var url = "https://www3.mackenzie.com.br/tia/tia_mobile/progress/EXT_alunohorario.php",
			data = {
				unidade: unidade,
	            tia: tia,
	            pass: password
	        };

		_user = []
		_cursos = [];
		_horarios = [];
		_disciplinas = [];
		
		$.post(url, data)
        	.done(
        		function(data) {
        			if (!data.resposta) {
						app.alert('Usuário ou senha invalido!');
						return;
        			}

            		_user = transformUser(data.resposta);

        			try {
        				if (cb) {
        					cb(_user);
        				}
        			} catch(err) {
        				app.alert('Error on load User: '+err);
        			}
				})
        	.fail(
        		function(err) {
        			app.alert('Usuário ou senha invalido!');
        		});
	};

	service.setTelerikUser = function(telerikUser) {
		var user = _user;

		_user = telerikUser;
		_user.CodAluno = user.Id;

		// Esses dados deverão vir já do user do telerik (criados assim)
		_user.UserName = user.Username;
		_user.tia = user.tia;
		_user.DisplayName = user.DisplayName;
		_user.Tipo = user.Tipo;
	};

	/*service.loadCursos = function(unidade, tia, password, cb) {
		var url = "https://www3.mackenzie.com.br/tia/tia_mobile/progress/EXT_nomealuno.php",
			data = {
				unidade: unidade,
	            tia: tia,
	            pass: password
	        };

		$.post(url, data)
        	.done(
        		function(data) {
            		_cursos = transformCursos(data.resposta);

        			try {
        				if (cb) {
        					cb(_cursos);
        				}
        			} catch(err) {
        				app.alert('Error on load Cursos: '+err);
        			};
				});
    };*/

    /*service.loadHorarios = function(unidade, tia, password, cb) {
		var url = "https://www3.mackenzie.com.br/tia/tia_mobile/progress/EXT_horarios.php",
			data = {
				unidade: unidade,
	            tia: tia,
	            pass: password
	        };

		$.post(url, data)
        	.done(
        		function(data) {
            		_horarios = transformHorarios(data.resposta);

        			try {
        				if (cb) {
        					cb(_horarios);
        				}
        			} catch(err) {
        				app.alert('Error on load Horarios: '+err);
        			};
				});
    };*/

    service.getUnidades = function() {
    	return _unidades;
    };

    service.getUser = function() {
    	return _user;
    };

    service.getCursos = function() {
    	return _cursos;
    };

    service.getListCursosId = function() {
        var cursos = [];

        for (var i=0; i < _cursos.length; i++) {
            cursos.push(_cursos[i].Id);
        }

        return cursos;
    };

    service.getHorarios = function() {
    	return _horarios;
    };

    service.getDisciplinas = function() {
    	var disciplinas = [];

    	for (var icurso in _cursos) {
    		var curso = _cursos[icurso];

    		for (var idisciplina in curso.Disciplinas) {
    			disciplinas.push(curso.Disciplinas[idisciplina]);
    		}
    	}

    	return disciplinas;
    }

    service.getListDisciplinasId = function(curso) {
    	var disciplinas;
        var lista = [];

        if (curso && curso.Disciplinas) {
			disciplinas = curso.Disciplinas;
        } else {
			disciplinas = service.getDisciplinas();
        }

        for (var i=0; i < disciplinas.length; i++) {
            lista.push(disciplinas[i].Id);
        }

        return lista;
    };

    init();

    return service;






	// MOCK - Remover depois
	function mockUser(user) {
		return user;
	    //return JSON.parse('{"resposta":{"cod_aluno":"9999","nome_aluno":"BRUNO GRUN","escola_sigla":"FCI","cod_curso":"9999","nome_curso":"FACULDADE DE COMPUTAÇÃO E INFORMÁTICA","duracao":"9","horarios":[{"cod_componente":"ENEC04797","nome_componente":"METOD DE PESQUISA EM COMPUTACAO","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"18:30","dia":"2","cod_escola":"051","nome_professor":"POLLYANA COELHO DA SILVA NOTAR"},{"cod_componente":"ENEC04797","nome_componente":"METOD DE PESQUISA EM COMPUTACAO","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"19:15","dia":"2","cod_escola":"051","nome_professor":"POLLYANA COELHO DA SILVA NOTAR"},{"cod_componente":"ENEC00119","nome_componente":"PRINCIPIOS EMPREENDEDORISMO II","turma":"06N","local":"3104405","predio":"31","sala":"405","hora":"21:40","dia":"2","cod_escola":"051","nome_professor":"JORGE FERNANDO MAXNUCK SOARES"},{"cod_componente":"ENEC00119","nome_componente":"PRINCIPIOS EMPREENDEDORISMO II","turma":"06N","local":"3104405","predio":"31","sala":"405","hora":"22:25","dia":"2","cod_escola":"051","nome_professor":"JORGE FERNANDO MAXNUCK SOARES"},{"cod_componente":"ENEX01310","nome_componente":"LINGUAGENS FORMAIS E AUTOMATOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"18:30","dia":"3","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01310","nome_componente":"LINGUAGENS FORMAIS E AUTOMATOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"19:15","dia":"3","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX04795","nome_componente":"TEORIA DOS GRAFOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:05","dia":"3","cod_escola":"051","nome_professor":"ANTONIO LUIZ BASILE"},{"cod_componente":"ENEX04795","nome_componente":"TEORIA DOS GRAFOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:50","dia":"3","cod_escola":"051","nome_professor":"ANTONIO LUIZ BASILE"},{"cod_componente":"ENEX01044","nome_componente":"PROGRAMACAO FUNCIONAL","turma":"06N11","local":"3103302","predio":"31","sala":"302","hora":"21:40","dia":"3","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01044","nome_componente":"PROGRAMACAO FUNCIONAL","turma":"06N11","local":"3103302","predio":"31","sala":"302","hora":"22:25","dia":"3","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEC00249","nome_componente":"PROBABILIDADE E ESTATISTICA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"18:30","dia":"4","cod_escola":"051","nome_professor":"WAGNER DE SOUZA BORGES"},{"cod_componente":"ENEC00249","nome_componente":"PROBABILIDADE E ESTATISTICA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"19:15","dia":"4","cod_escola":"051","nome_professor":"WAGNER DE SOUZA BORGES"},{"cod_componente":"ENEX04795","nome_componente":"TEORIA DOS GRAFOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:05","dia":"4","cod_escola":"051","nome_professor":"ANTONIO LUIZ BASILE"},{"cod_componente":"ENEX04795","nome_componente":"TEORIA DOS GRAFOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:50","dia":"4","cod_escola":"051","nome_professor":"ANTONIO LUIZ BASILE"},{"cod_componente":"ENEX00562","nome_componente":"CALCULO IV","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"21:40","dia":"4","cod_escola":"051","nome_professor":"VILAR RIBEIRO DE FIGUEIREDO"},{"cod_componente":"ENEX00562","nome_componente":"CALCULO IV","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"22:25","dia":"4","cod_escola":"051","nome_professor":"VILAR RIBEIRO DE FIGUEIREDO"},{"cod_componente":"ENEX01045","nome_componente":"PROGRAMACAO PARALELA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"18:30","dia":"5","cod_escola":"051","nome_professor":"MARIO OLIMPIO DE MENEZES"},{"cod_componente":"ENEX01045","nome_componente":"PROGRAMACAO PARALELA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"19:15","dia":"5","cod_escola":"051","nome_professor":"MARIO OLIMPIO DE MENEZES"},{"cod_componente":"ENEX01044","nome_componente":"PROGRAMACAO FUNCIONAL","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:05","dia":"5","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01044","nome_componente":"PROGRAMACAO FUNCIONAL","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"20:50","dia":"5","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01310","nome_componente":"LINGUAGENS FORMAIS E AUTOMATOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"18:30","dia":"6","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01310","nome_componente":"LINGUAGENS FORMAIS E AUTOMATOS","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"19:15","dia":"6","cod_escola":"051","nome_professor":"DANIELA VIEIRA CUNHA"},{"cod_componente":"ENEX01045","nome_componente":"PROGRAMACAO PARALELA","turma":"06N11","local":"3103302","predio":"31","sala":"302","hora":"20:05","dia":"6","cod_escola":"051","nome_professor":"MARIO OLIMPIO DE MENEZES"},{"cod_componente":"ENEX01045","nome_componente":"PROGRAMACAO PARALELA","turma":"06N11","local":"3103302","predio":"31","sala":"302","hora":"20:50","dia":"6","cod_escola":"051","nome_professor":"MARIO OLIMPIO DE MENEZES"},{"cod_componente":"ENEC00249","nome_componente":"PROBABILIDADE E ESTATISTICA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"21:40","dia":"6","cod_escola":"051","nome_professor":"WAGNER DE SOUZA BORGES"},{"cod_componente":"ENEC00249","nome_componente":"PROBABILIDADE E ESTATISTICA","turma":"06N","local":"3103302","predio":"31","sala":"302","hora":"22:25","dia":"6","cod_escola":"051","nome_professor":"WAGNER DE SOUZA BORGES"}]}}').resposta;
	};

	function mockCursos(cursos) {
		return cursos.resposta;

		var cursos = [], item;

		// Curso 1
		item = {};
			item.Duracao = 8,
			item.Curso = 'Tecnologia em Análise e Desenvolvimento de Sistemas',
			item.Id = '18c5a7b0-528a-11e6-b1e0-77d175454ffc';
			
			item.Users = "aa011da0-5b2b-11e6-8e46-f3062ef62b2a";

			var disciplinas = [];
			var disc = {};
			disc.Nome = 'Fundamentos de Computação e Sistemas';
			disc.Professor = {
				Nome: 'Nome do professor...',
				Unidade: 'U1',
				Turma: 'T1',
				Sala: 'S1',
				//Id: '39b92be0-528a-11e6-bcc1-5b5edbc21f50'
			},
			disc.Id = '88d74580-528b-11e6-9146-d957c67c4429';
			disciplinas.push(disc);
			item.Disciplinas = disciplinas;

			cursos.push(item);

		// Curso 2
		item = {};
			item.Duracao = 10,
			item.Curso = 'X em Análise de Sistemas',
			item.Id = 'X8c5a7b0-528a-11e6-b1e0-77d175454ffc';
			
			item.Users = "aa011da0-5b2b-11e6-8e46-f3062ef62b2a";

			var disciplinas = [];
			var disc = {};
			disc.Nome = 'X Computação e Sistemas';
			disc.Professor = {
				Nome: 'X Nome do professor...',
				Unidade: 'U2',
				Turma: 'T12',
				Sala: 'S2',
				//Id: 'X9b92be0-528a-11e6-bcc1-5b5edbc21f50'
			},
			disc.Id = 'X8d74580-528b-11e6-9146-d957c67c4429';
			disciplinas.push(disc);
			item.Disciplinas = disciplinas;

			cursos.push(item);

		return cursos;
		//return JSON.parse('[{"Disciplinas":[{"Professor":"39b92be0-528a-11e6-bcc1-5b5edbc21f50","Nome":"Fundamentos de Computação e Sistemas","CreatedAt":"2016-07-25T17:16:33.112Z","ModifiedAt":"2016-09-16T10:45:41.467Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","Cursos":["18c5a7b0-528a-11e6-b1e0-77d175454ffc"],"color":"#005ce6","Id":"88d74580-528b-11e6-9146-d957c67c4429","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}},{"Nome":"Computação Aplicada","Professor":"4d1d0210-528a-11e6-bcc1-5b5edbc21f50","CreatedAt":"2016-07-25T17:16:47.249Z","ModifiedAt":"2016-07-25T17:29:20.077Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","Cursos":["18c5a7b0-528a-11e6-b1e0-77d175454ffc"],"Id":"91446810-528b-11e6-9146-d957c67c4429","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}}],"Duracao":8,"Curso":"Tecnologia em Análise e Desenvolvimento de Sistemas","Professores":["39b92be0-528a-11e6-bcc1-5b5edbc21f50","4d1d0210-528a-11e6-bcc1-5b5edbc21f50"],"CreatedAt":"2016-07-25T17:06:15.595Z","ModifiedAt":"2016-09-16T00:06:04.835Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","Users":["aa011da0-5b2b-11e6-8e46-f3062ef62b2a"],"Id":"18c5a7b0-528a-11e6-b1e0-77d175454ffc","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}},{"Disciplinas":[{"Professor":"4d1d0210-528a-11e6-bcc1-5b5edbc21f50","Nome":"Teoria Básica da Administração","Cursos":["60d879c0-542d-11e6-a837-d5631e875d68"],"CreatedAt":"2016-07-27T19:08:09.267Z","ModifiedAt":"2016-09-02T15:28:43.369Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","color":"#4dff4d","Id":"74e2f030-542d-11e6-a837-d5631e875d68","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}},{"Professor":"4d1d0210-528a-11e6-bcc1-5b5edbc21f50","Nome":"Gestão Financeira","Cursos":["60d879c0-542d-11e6-a837-d5631e875d68"],"CreatedAt":"2016-07-27T19:10:54.264Z","ModifiedAt":"2016-08-12T23:08:30.840Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","color":"#005ce6","Id":"d73b5470-542d-11e6-8b46-71c7852ac6e7","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}}],"Duracao":8,"Curso":"Administração","CreatedAt":"2016-07-27T19:07:35.644Z","ModifiedAt":"2016-09-16T00:06:14.104Z","CreatedBy":"00000000-0000-0000-0000-000000000000","ModifiedBy":"00000000-0000-0000-0000-000000000000","Owner":"00000000-0000-0000-0000-000000000000","Users":["fbbf44c0-52a0-11e6-9146-d957c67c4429"],"Id":"60d879c0-542d-11e6-a837-d5631e875d68","Meta":{"Permissions":{"CanRead":true,"CanUpdate":true,"CanDelete":true}}}]');
	};

})();
