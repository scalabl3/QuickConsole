var qc, editor, ace, auto_pub, enc, dec, decrypt_pass;

qc = {};
decrypt_pass = "";

function init_qc() {
    qc = {
        p: null,
        p2: null,
        presets: {
            1: {
                message_font_size: 10,
                message_column_size: 300
            },
            2: {
                message_font_size: 12,
                message_column_size: 360
            },
            3: {
                message_font_size: 15,
                message_column_size: 420
            }
        },
        qc_cipher: "encryptme",
        settings: {
            console_name: "My Console",
            qc_cipher: "encryptme",
            message_font_size: 10,
            message_column_size: 300,
            origin: "pubsub.pubnub.com",
            pubkey: "demo",
            subkey: "demo",
            channels: ["ch1"],
            publish_channels: ["ch1"],
            auth: "",
            ssl: true,
            uuid: "quick-console-" + (1000000 + Math.floor(Math.random() * 1000000)),
            auto_publish: false,
            auto_publish_interval: 5000
        }
    };
}

function setup_console(is_reset) {

    init_qc();

    is_reset = (is_reset ? true : false);

    if (!is_reset) {
        setup_publish_editor();             // console-editor.js
    }

    if (load_from_querystring()){           // console-url.js

        console.log(qc.settings.ssl);
        qc.settings.ssl = true;
        save_to_querystring();
        console.log(qc.settings.ssl);
        setup_console_step2();
    }
}

function setup_console_step2() {
    setup_subscribe_columns();              // console-colunns.js
    setup_console_bindings();               // console-bindings.js
    do_pn_init();                           // console-pn.js
    do_subscribe();                         // console-pn.js

    if (qc.settings.auto_publish) {
        setTimeout(function(){
            do_publish_auto();
        }, 1500);
    }
}

function reset_console() {
    // clean out columns
}


$(function() {

    changeCssClass("#wrapper-scroll", "min-width: 2000px");
    
    if (window.location.origin.indexOf("localhost") >= 0) {
        $("#favicon").attr("href", "./images/favicon-local.png")
    }
    
    setup_console();


    $('.tooltipper').tooltipster();
    $('body').perfectScrollbar({
        suppressScrollY: true
    });

    $("html").keypress(function(e){
        if (e.ctrlKey) {
            switch (e.charCode) {
                case 49: scrollX(0); break; // ctrl-1
                case 50: scrollX(1); break; // ctrl-2
                case 51: scrollX(2); break; // ctrl-3
                case 52: scrollX(3); break; // ctrl-4
                case 54: scrollX(4); break; // ctrl-5
                case 55: scrollX(5); break; // ctrl-6
                case 56: scrollX(6); break; // ctrl-7
                case 57: scrollX(7); break; // ctrl-8
                case 58: scrollX(8); break; // ctrl-9
                case 31: decrease_font_size(); break; // ctrl-
                case 61: increase_font_size(); break; // ctrl+
            }
        }
        if (e.altKey) {
            //(alt- and alt=)
            switch (e.charCode) {
                case 8211:
                    decrease_column_size();
                    break;
                case 8800:
                    increase_column_size();
                    break;
            }
        }
    });
});


