'use strict';

(function() {
    var app = {
        data: {}
    };

    var bootstrap = function() {
        $(function() {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'flat',
                initial: 'components/home/view.html'
            });

            kendo.culture("pt-BR");
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

        if (app && app.user) {
            if (app.user.data) {
                data = app.user.data;
            } else {
                data = app.user;
            }
        }

        return data;
    }

    app.displayUser = function() {
        var user = app.getUserData();

        $('[id=displayUser]').each(function(index, item) {
            $(item).text(user.DisplayName);
        });

        $('[id=displayTIA]').each(function(index, item) {
            $(item).text(user.tia);
        });
    }

function onDrawerShow() {
    alert('s');
}
}());

// START_CUSTOM_CODE_kendoUiMobileApp
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_kendoUiMobileApp