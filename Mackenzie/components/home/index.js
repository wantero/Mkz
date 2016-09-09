'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});


// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home
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
                    alert(error.message);
                }
                return false;
            }

            var activeView = mode === 'signin' ? '.signin-view' : '.signup-view',
                model = parent.homeModel;

            if (provider.setup && provider.setup.offlineStorage && !app.isOnline()) {
                $('.offline').show().siblings().hide();
            } else {
                $(activeView).show().siblings().hide();
                /*if (mode === 'register') {
                    $('input').val('');
                }*/
            }

            if (model && model.set) {
                model.set('logout', null);
            }

            var rememberedData = localStorage ? JSON.parse(localStorage.getItem(rememberKey)) : app[rememberKey];
            if (rememberedData && rememberedData.tia && rememberedData.password) {
                parent.homeModel.set('tia', rememberedData.tia);
                parent.homeModel.set('password', rememberedData.password);
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
                    provider.Users.logout(init, init);
                    return;
                }

                var rememberedData = {
                    tia: model.tia,
                    password: model.password
                };

                if (model.rememberme && rememberedData.tia && rememberedData.password) {
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
                                        '<br><br>O acesso ao sistema necessita da aprovação de seu professor.'+
                                        '<br><br>Em breve você receberá um e-mail coma confirmação de seu acesso.', cadastroOk);
                    } else {
                        if (!data.result.Id) {
                            provider.Users.currentUser().then(
                                function(user) {
                                    app.user.data = user.result;

                                    //user.result.IsVerified = false;
                                    if (!user.result.IsVerified) {
                                        app.showMessage('Please verify you email and confirm you account!');
                                    } else {
                                        //user.result.TermoAceite = false;
                                        if (!user.result.TermoAceite) {
                                            app.mobileApp.navigate('components/home/termoAceite.html');
                                        } else {
                                            app.mobileApp.navigate('components/' + redirect + '/view.html');
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
                    alert('error');
                }
            );
        },
        aceiteCancel = function() {                
            mode = 'signin';
            app.mobileApp.navigate('components/home/view.html');
        },

        homeModel = kendo.observable({
            displayName: '',
            tia: '',
            password: '',
            validateData: function(data) {
                if (!data.tia) {
                    alert('Missing TIA');
                    return false;
                }

                if (mode === 'register') {
                    if (!data.displayName) {
                        alert('Missing Name');
                        return false;
                    }

                    if (!data.email) {
                        alert('Missing email');
                        return false;
                    }
                }

                if (!data.password) {
                    alert('Missing password');
                    return false;
                }

                if (mode === 'register') {
                    if (!data.confirmPassword) {
                        alert('Missing confirmation password');
                        return false;
                    }

                    if (data.password != data.confirmPassword) {
                        alert('Senha de confirmação deve ser a mesma!');
                        return false;
                    }
                }

                return true;
            },
            signin: function() {
                var model = homeModel,
                    tia = model.tia.toLowerCase(),
                    password = model.password;

                if (!model.validateData(model)) {
                    return false;
                }

                provider.Users.login(tia, password, successHandler, init);
                //navbar.show();
            },
            register: function() {
                var model = homeModel,
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

                provider.Users.register(tia, password, attrs, successHandler, init);
            },
            forgotPassword: function() {
                if (!homeModel.tia) {
                    alert('Missing TIA');
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
                            alert(e.message);
                        } else {
                            alert('Error on reset password!');
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
                init();
            }
        });

    parent.set('homeModel', homeModel);
    
    parent.set('afterShow', function(e) {
        if (e && e.view && e.view.params && e.view.params.logout) {
            if (localStorage) {
                localStorage.setItem(rememberKey, null);
            } else {
                app[rememberKey] = null;
            }

            homeModel.password = '';
            $('#senha').val(homeModel.password);
            homeModel.set('logout', true);
        }

        provider.Users.currentUser().then(successHandler, init);
    });
})(app.home);



function onDrawerShow() {
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
        $('#drawerPicture').attr('src', fotoUri);
    }
}


// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel