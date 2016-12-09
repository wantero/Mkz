'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});


(function(parent) {
    var provider = app.data.mackenzie,
        mode = 'signin',
        registerRedirect = 'home',
        signinRedirect = 'muralView',
        rememberKey = 'mackenzie_authData_homeModel',
        navbar = '',
        init = function(error) {
            if (error) {
                if (error.message) {
                    app.alert(error.message);
                }
                return false;
            }

            var activeView = mode === 'signin' ? '.signin-view' : '.signup-view',
                model = parent.homeModel;

            if (provider.setup && provider.setup.offlineStorage && !app.isOnline()) {
                $('.offline').show().siblings().hide();
            } else {
                $(activeView).show().siblings().hide();
            }

            if (model && model.set) {
                model.set('logout', null);
            }

            var rememberedData = localStorage ? JSON.parse(localStorage.getItem(rememberKey)) : app[rememberKey];
            if (rememberedData && rememberedData.unidade && rememberedData.tia && rememberedData.password) {
                parent.homeModel.set('unidade', rememberedData.unidade);
                parent.homeModel.set('tia', rememberedData.tia);
                parent.homeModel.set('password', rememberedData.password);

                $('#unidadesLogin').val(rememberedData.unidade);
                $('#rememberme').attr('checked', '');

                parent.homeModel.rememberme = true;
                parent.homeModel.signin();
            }
        },
        successHandler = function(data) {
            var redirect = mode === 'signin' ? signinRedirect : registerRedirect,
                model = parent.homeModel || {},
                logout = model.logout;

            if (logout) {
                model.set('logout', null);
            }

            if (data && data.result) {
                if (logout) {
                    if (!provider.isOffline()) {
                        provider.Users.logout(init, init);
                    }

                    MkzDataService.resetData();

                    return;
                }

                var rememberedData = {
                    unidade: model.unidade,
                    tia: model.tia,
                    password: model.password
                };

                if (model.rememberme && rememberedData.unidade && rememberedData.tia && rememberedData.password) {
                    if (localStorage) {
                        localStorage.setItem(rememberKey, JSON.stringify(rememberedData));
                    } else {
                        app[rememberKey] = rememberedData;
                    }
                }

                app.user = data.result;

                setTimeout(function() {
                    //mode = 'register';
                    if (mode === 'register') {
                        mode = 'signin';
                        app.showMessage('<b>Cadastro realizado com sucesso.</b>'+
                                        //'<br><br>O acesso ao sistema necessita da aprovação de seu professor.'+
                                        '<br><br>Em breve você receberá um e-mail coma confirmação de seu acesso.', cadastroOk);
                    } else {
                        if (!data.result.Id) {
                            provider.Users.currentUser().then(
                                function(user) {
                                    // INTEGRACAO DADOS MACKENZIE
                                    //app.user.data = user.result;
                                    // INTEGRACAO DADOS MACKENZIE

                                    // INTEGRACAO DADOS MACKENZIE
                                    app.user.data = MkzDataService.getUser();
                                    // INTEGRACAO DADOS MACKENZIE

                                    //user.result.IsVerified = false;
                                    if (!user.result.IsVerified) {
                                        app.showMessage('Please verify you email and confirm you account!');
                                    } else {
                                        //user.result.TermoAceite = false;
                                        if (!user.result.TermoAceite) {
                                            app.mobileApp.navigate('components/home/termoAceite.html');
                                        } else {
                                            MkzDataService.loadAllData(function() {       
                                                app.mobileApp.navigate('components/' + redirect + '/view.html');
                                            });
                                        }
                                    }
                                },
                                function(error) {
                                    console.log('error:', error);
                                }
                            );
                        }
                    }
                }, 0);
            } else {
                init();
            }
        },
        cadastroOk = function() {
            init();
            $('#senha').val('');
        },
        aceiteOk = function() {                
            var redirect = mode === 'signin' ? signinRedirect : registerRedirect;

            provider.Users.currentUser().then(
                function(user) {
                    provider.Users.updateSingle(
                        {
                            'Id': user.result.Id, // filter
                            'TermoAceite': true
                        },
                        function(data){
                            app.mobileApp.navigate('components/' + redirect + '/view.html');
                        },
                        function(error){
                            console.log('error on update user');
                        }
                    );
                },
                function() {
                    app.alert('error');
                }
            );
        },
        aceiteCancel = function() {                
            mode = 'signin';
            app.mobileApp.navigate('components/home/view.html');
        },

        homeModel = kendo.observable({
            displayName: '',
            unidade: '',
            tia: '',
            password: '',
            /*unidade: '001',
            //tia: '1129146',
            tia: '41326652',
            password: 'GERTI#m1c2',*/
            validateData: function(data) {
                if (!data.unidade) {
                    app.alert('Favor informar a unidade');
                    return false;
                }

                if (!data.tia) {
                    app.alert('Favor informar o TIA');
                    return false;
                }

                if (mode === 'register') {
                    if (!data.email) {
                        app.alert('Favor informar o email');
                        return false;
                    }
                }

                if (!data.password) {
                    app.alert('Favor informar a senha');
                    return false;
                }

                // INTEGRACAO DADOS MACKENZIE
                /*if (mode === 'register') {
                    if (!data.confirmPassword) {
                        app.alert('Missing confirmation password');
                        return false;
                    }

                    if (data.password != data.confirmPassword) {
                        app.alert('Senha de confirmação deve ser a mesma!');
                        return false;
                    }
                }*/
                // INTEGRACAO DADOS MACKENZIE

                return true;
            },
            signin: function() {
                if (provider.isOffline()) {
                    app.alert('Esta aplicação necessita de acesso à dados!');
                    return;
                }

                var model = homeModel,
                    unidade = model.unidade,
                    tia = model.tia.toLowerCase(),
                    password = model.password;

                if (!model.validateData(model)) {
                    return false;
                }

                MkzDataService.unidade(unidade);
                MkzDataService.tia(tia);
                MkzDataService.password(password);

                MkzDataService.loadUser(unidade, tia, password, function(mkzUser) {
                    // ??? users.changePassword('1', password, newPassword, keepTokens)
                    if (mkzUser) {
                        //provider.Users.login('1', '321', function(data) {
                        provider.Users.login(tia, '!'+unidade+'#'+tia+'@', function(data) {
                            provider.Users.currentUser().then(function(user) {
                                MkzDataService.setTelerikUser(user.result);
                                successHandler(data);
                            });
                        }, function(err) {
                            if (err.message.toLowerCase().indexOf('invalid user') >= 0) {
                                app.alert('Usuário ainda não cadastrado no Mac Cloud! Favor criar sua conta no Mac Cloud com usuário/senha do TIA');
                            } else {
                                init(err);
                            }
                        });
                    } else {
                        app.alert('Login inválido!');
                    }
                });
            },
            register: function() {
                if (provider.isOffline()) {
                    app.alert('Esta aplicação necessita de acesso à dados!');
                    return;
                }

                var model = homeModel,
                    unidade = model.unidade,
                    tia = model.tia.toLowerCase(),
                    password = model.password,
                    displayName = model.displayName,
                    attrs = {
                        tia: tia,
                        DisplayName: displayName,
                        Email: model.email
                    };

                if (!model.validateData(model)) {
                    return false;
                }

                MkzDataService.loadUser(unidade, tia, password, function(mkzUser) {
                    attrs.DisplayName = mkzUser.DisplayName;
                    provider.Users.register(tia, '!'+unidade+'#'+tia+'@', attrs, successHandler, init);
                });
            },
            forgotPassword: function() {
                if (!homeModel.tia) {
                    app.alert('Favor informar o TIA');
                    return false;
                }

                var userForgotPassword = {
                    Username: homeModel.tia.toLowerCase()
                };

                provider.Users.resetPassword(userForgotPassword,
                    function() {
                        app.showMessage('Um email foi enviado. Favor seguir as instruções.');
                    },
                    function(e) {
                        if (e.code && e.code == 228) {
                            app.alert(e.message);
                        } else {
                            app.alert('Error on reset password!');
                        }
                    });
            },
            aceite: function() {
                // REGISTRA TERMO ACEITE DO USUARIO
                app.showMessage({
                    message: 'Eu li e concordo com os termos e condições de utilização deste aplicativo.',
                    type: 'option',
                    click: {
                        op1: aceiteCancel,
                        op2: aceiteOk
                    }
                });
            },
            toggleView: function() {
                $('input').val('');

                mode = mode === 'signin' ? 'register' : 'signin';

                if (mode === 'register') {
                    if (provider.isOffline()) {
                        app.alert('Esta aplicação necessita de acesso à dados!');
                        return;
                    }
                }

                init();
            }
        });

    parent.set('homeModel', homeModel);
    
    parent.set('onShow', function(e) {
        populateUnidades();
    });

    parent.set('afterShow', function(e) {
        if (e && e.view && e.view.params && e.view.params.logout) {
            if (localStorage) {
                if (!homeModel.rememberme) {
                    localStorage.setItem(rememberKey, null);
                }
            } else {
                app[rememberKey] = null;
                homeModel.password = '';
            }

            $('#senha').val(homeModel.password);
            homeModel.set('logout', true);
        }

        $('#unidadesLogin').val(homeModel.unidade);

        provider.Users.currentUser().then(successHandler, init);
    });

    function populateUnidades() {
        var unidades = MkzDataService.getUnidades();
        var options = '<option value="" disabled selected>Unidade</option>';

        for (var index in unidades) {
            var unidade = unidades[index];
            options += '<option value="'+unidade.unidade+'">'+unidade.nome_unidade+'</option>';
        }

        $('#unidadesLogin').html(options);
        $('#unidadesSignup').html(options);
    }


    //Switch to online mode when the device connects to the network
    document.addEventListener("online", function() {
        app.data.mackenzie.online();
        console.log('on-line');
        app.data.mackenzie.alreadyOffline = false;

        MkzDataService.loadUnidades(function() {
            MkzDataService.status('ready');
            populateUnidades();
        });
    });

    //Switch to offline mode when the device looses network connectivity   
    document.addEventListener("offline", function() {
        if (app.data.mackenzie.alreadyOffline) {
            return;
        }
      
        app.data.mackenzie.offline();
        console.log('off-line');
        app.data.mackenzie.alreadyOffline = true;

        app.alert('Esta aplicação necessita de acesso à dados!');
    });

})(app.home);






/*window.onpopstate = function(ev) {
    if (app.getUserData().Username) {
        console.log('onPopState: ok')
    } else {
        console.log('onPopState: prevent');
        //window.history.replaceState({}, 'login', 'components/home/view.html');
        //ev.preventDefault();
    }
}*/






/*function onDrawerShow() {
    var data;

    if (app && app.user) {
        if (app.user.data) {
            data = app.user.data;
        } else {
            data = app.user;
        }
    }

    var name = data && data.Username ? data.Username : '';
    var tia = data && data.tia ? data.tia : '';
    var fotoUri = data && data.fotoUri ? data.fotoUri : undefined;

    $('#drawerUser').text(name);
    $('#drawerTIA').text(tia);

    if (fotoUri) {
        $('#drawerPicture').get(0).style.backgroundImage = "url("+fotoUri+")";
    } else {
        $('#drawerPicture').get(0).style.backgroundImage = "url(../../styles/images/user-male.png)";
    }
}*/
