'use strict';

(function() {
    var app = {
        data: {}
    };

    var bootstrap = function() {
        MkzDataService.waitForReady(function() {
            $(function() {
                kendo.culture("pt-BR");

                app.mobileApp = new kendo.mobile.Application(document.body, {
                    skin: 'flat',
                    initial: 'components/home/view.html'
                });
            });
        });
    };

    if (window.cordova) {
        document.addEventListener('deviceready', function() {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            var element = document.getElementById('appDrawer');
            if (typeof(element) != 'undefined' && element !== null) {
                if (window.navigator.msPointerEnabled) {
                    $('#navigation-container').on('MSPointerDown', 'a', function(event) {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function(event) {
                        app.keepActiveState($(this).closest('li'));
                    });
                }
            }

            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li.active').removeClass('active');
        currentItem.addClass('active');
    };

    window.app = app;

    app.isOnline = function() {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
    };

    app.openLink = function(url) {
        if (url.substring(0, 4) === 'geo:' && device.platform === 'iOS') {
            url = 'http://maps.apple.com/?ll=' + url.substring(4, url.length);
        }

        window.open(url, '_system');
        if (window.event) {
            window.event.preventDefault && window.event.preventDefault();
            window.event.returnValue = false;
        }
    };

    app.showMessage = function(message, callback) {
        var messageView = $('#modalview-message');
        var messageDiv = messageView.find('#message');

        if (message instanceof Object) {
            var messageObj = message;
            message = messageObj.message;

            if (messageObj.type && messageObj.type == 'option') {
                messageView.find('#modalview-message-option').show().siblings().hide();
            } else {
                messageView.find('#modalview-message-ok').show().siblings().hide();
            }
        }

        try {
            var messageTemplate = $('#'+message);
        } catch(e) {}

        if (messageDiv.length) {
            if (messageTemplate && messageTemplate.length) {
                messageDiv.html(messageTemplate.html());
            } else {
                messageDiv.html(message);
            }
        }

        if (messageObj) {
            if (messageObj.click) {
                if (messageObj.click.op1) {
                    messageView[0].callbackMessageOp1 = messageObj.click.op1;
                }

                if (messageObj.click.op2) {
                    messageView[0].callbackMessageOp2 = messageObj.click.op2;
                }
            }
        } else if (callback) {
            messageView[0].callbackMessage = callback;
        }

        messageView.kendoMobileModalView("open");
    };

    app.onMessageModalViewInit = function(e) {
        var okButton = $('#modalview-message #modalview-ok-button');
        var op1Button = $('#modalview-message #modalview-op1-button');
        var op2Button = $('#modalview-message #modalview-op2-button');

        okButton.click(function() {
            var messageView = $('#modalview-message');
            messageView.kendoMobileModalView("close");

            if (messageView[0].callbackMessage) {
                messageView[0].callbackMessage();
                messageView[0].callbackMessage = undefined;
            }
        });

        op1Button.click(function() {
            var messageView = $('#modalview-message');
            messageView.kendoMobileModalView("close");

            if (messageView[0].callbackMessageOp1) {
                messageView[0].callbackMessageOp1();
                messageView[0].callbackMessage = undefined;
            }
        });

        op2Button.click(function() {
            var messageView = $('#modalview-message');
            messageView.kendoMobileModalView("close");

            if (messageView[0].callbackMessageOp2) {
                messageView[0].callbackMessageOp2();
                messageView[0].callbackMessage = undefined;
            }
        });
    };

    app.getUserData = function() {
        var data;

        // INTEGRACAO DADOS MACKENZIE
        /*if (app && app.user) {
            if (app.user.data) {
                data = app.user.data;
            } else {
                data = app.user;
            }
        }*/
        // INTEGRACAO DADOS MACKENZIE

        // INTEGRACAO DADOS MACKENZIE
        data = MkzDataService.getUser();
        // INTEGRACAO DADOS MACKENZIE

        return data;
    }

    function verifyTeacherUser() {
        var user = MkzDataService.getUser();                                         
        var link = user.Tipo == 'P' ? 'components/disciplinasView/view.html' : 'components/cursosView/view.html';

        if (user.Tipo == 'P') {
            $('#bt-tab-cursos').hide();
        } else {
            $('#bt-tab-cursos').show();
        }

        $('.flaticon-search,.flaticon-book').each(function(idx, item) {
            $(item).attr('href', link);
        });
    };

    app.displayUser = function() {
        var user = app.getUserData();

        $('[id=displayUser]').each(function(index, item) {
            $(item).text(user.DisplayName);
        });

        $('[id=displayTIA]').each(function(index, item) {
            $(item).text(user.tia);
        });

        verifyTeacherUser();
    };

    app.showQuizzBadgeTimer = function() {
        app.avaliacoesView.avaliacoesViewModel.loadAvaliacoes(null, function(avaliacoes) {
            var pendentes = 0;

            for (var idx in avaliacoes) {
                var avaliacao = avaliacoes[idx];

                if (avaliacao.Situacao.toLowerCase() === 'valido') {
                    pendentes ++;
                }
            }

            $('[name="main-footer"]').each(function(index, item) {
                var tabstrip = $(item).data("kendoMobileTabStrip");
                
                if (tabstrip) {
                    tabstrip.badge(4, pendentes ? pendentes : false);
                }
            });
        });
    };

    (function showQuizzBadgeTimer() {
        setInterval(function() {
            app.showQuizzBadgeTimer()
        }, 15 * 60 * 1000);
    })();


    app.pontos = {};
    function getPontos(done) {
        app.data.mackenzie.Users.currentUser()
            .then(
                function(user) {
                    done(user.result);
                }
            );
    };

    app.pontos.add = function(pontos, done) {
        getPontos(function(user) {
            var pontosAtual = !user.Pontos ? 0 : user.Pontos;

            app.data.mackenzie.Users.updateSingle({
                    'Id': user.Id,
                    'Pontos': pontosAtual+pontos
                },
                function(data) {
                    done(data);
                },
                function(error){
                    app.alert('Error writing data (RespostasAvaliacao)');
                }
            );
        });
    };

    app.pontos.sub = function(pontos, done) {
        getPontos(function(user) {
            var pontosAtual = !user.Pontos ? 0 : user.Pontos;

            app.data.mackenzie.Users.updateSingle({
                    'Id': user.Id,
                    'Pontos': pontosAtual > pontos ? pontosAtual-pontos : 0
                },
                function(data) {
                    done(data);
                },
                function(error){
                    app.alert('Error writing data (RespostasAvaliacao)');
                }
            );            
        });
    };

    app.alert = function(msg) {
        navigator.notification.alert(msg, null, ' ');
    };

    // Desligar o BackButton no Android
    $(document).on('deviceready', function() {
        document.addEventListener('backbutton', function(e) {
            e.preventDefault();
        });
    });

}());
