
function setup_console_bindings(){
    populate_fields();
    apply_column_widths_and_font_sizes();
    enableTogglers();
    bind_events();
}

function populate_fields(){
    $("#txt-console-name").val(qc.settings.console_name);
    $("#txt-pubkey").val(qc.settings.pubkey);
    $("#txt-subkey").val(qc.settings.subkey);
    $("#txt-subchannels").val(qc.settings.channels.join(', '));
    $("#txt-pubchannels").val(qc.settings.publish_channels.join(', '));
    $("#txt-pubchannels2").val(qc.settings.publish_channels.join(', '));
    $("#txt-authkey").val(qc.settings.auth);
    $("#txt-uuid").val(qc.settings.uuid);

    if (qc.settings.origin === "pubsub.pubnub.com") {
        $("#rad-pn-origin-1").prop("checked", true);
        $("#rad-pn-origin-2").prop("checked", false);
        $("#console-brand").attr("src","images/pubnub-icon-600x600.png");
    }
    else {
        $("#rad-pn-origin-1").prop("checked", false);
        $("#rad-pn-origin-2").prop("checked", true);
        $("#console-brand").attr("src","images/blocks-logo2.png");
    }
    $('#txt-pn-origin').val(qc.settings.origin);
    $("#console-name").text(qc.settings.console_name);
    $(document).prop('title', qc.settings.console_name + " -- PN QuickConsole");
}

function enableTogglers() {
    $('.toggler').on('click', function () {
        $(this).toggleClass('fa-pause-circle fa-circle-o-notch fa-spin on');
    });
}

function bind_column_buttons() {
    console.log("cols", qc.settings.channels.length);

    $("i.ch-btn").each(function(i){

        $(this).off("click").click(function() {
            var b = $(this);
            var o = b.attr("data-op");
            var i = parseInt(b.attr("data-index"));
            var c = b.attr("data-channel");

            switch (o) {
                case "edit": console.log(i,o,c);
                    $("#txt-edit-channel").attr("data-channel", c).attr("data-index", i).attr("value", c);
                    $("#modal-edit-channel").modal("show");
                    break;
                case "left":
                    if (i > 0) {

                        console.log(i,o,c);

                        var x = $("div.channel-container[data-index=" + (i - 1) + "]");
                        var y = $("div.channel-container[data-index=" + i + "]");

                        console.log(x, x.attr("data-index"), x.attr("data-channel"));
                        console.log(y, y.attr("data-index"), y.attr("data-channel"));

                        x.detach();
                        y.after(x);

                        // TODO: Reorder Subscribe List & Save


                        // Change Data Index
                        x.attr("data-index", i);

                        x.find(".ch-col").each(function(){
                            $(this).attr("data-index", i);
                        });

                        y.attr("data-index", i - 1);

                        y.find(".ch-col").each(function(){
                            $(this).attr("data-index", i - 1);
                        });


                        bind_column_buttons();

                    }
                    break;
                case "right":
                    if (i < (qc.settings.channels.length - 1)) {

                        console.log(i,o,c);

                        // Grab Divs
                        var x = $("div.channel-container[data-index=" + i + "]");
                        var y = $("div.channel-container[data-index=" + (i + 1) + "]");

                        console.log(x, x.attr("data-index"), x.attr("data-channel"));
                        console.log(y, y.attr("data-index"), y.attr("data-channel"));

                        x.detach();
                        y.after(x);

                        // TODO: Reorder Subscribe List & Save


                        // Change Data Index
                        x.attr("data-index", i + 1);

                        x.find(".ch-col").each(function(){
                            $(this).attr("data-index", i + 1);
                        });

                        y.attr("data-index", i);

                        y.find(".ch-col").each(function(){
                            $(this).attr("data-index", i);
                        });

                        bind_column_buttons();

                    }
                    break;
                case "remove": console.log(i,o,c);
                    break;
            }
        });
    });
}

function bind_events() {

    $("input[name='rad-pn-origin']").each(function(i){
       $(this).change(function(){
           qc.settings.origin = $("input[name='rad-pn-origin']:checked").val();
           $('#txt-pn-origin').val(qc.settings.origin);
           if (qc.settings.origin === "pubsub.pubnub.com") {
               $("#console-brand").attr("src","images/pubnub-icon-600x600.png");
           }
           else {
               $("#console-brand").attr("src","images/blocks-logo2.png");
           }
           save_to_querystring();
           reset_console();
       });
    });

    $("#txt-console-name").change(function () {
        qc.settings.console_name = $(this).val();
        $("#console-name").text(qc.settings.console_name);
        $(document).prop('title', qc.settings.console_name + " -- PN QuickConsole");
        save_to_querystring();
        reset_console();
    });

    $("#txt-pubkey").change(function () {
        qc.settings.pubkey = $(this).val();
        save_to_querystring();
        reset_console();
    });

    $("#txt-subkey").change(function () {
        qc.settings.subkey = $(this).val();
        save_to_querystring();
        reset_console();
    });

    $("#txt-subchannels").change(function () {
        qc.settings.channels = convert_comma_separate_to_array($(this).val());
        $("#txt-subchannels").val(qc.settings.channels.join(', '));
        save_to_querystring();
        reset_console();
    });

    $("#txt-authkey").change(function () {
        qc.settings.auth = $(this).val();
        $("#txt-authkey").val(qc.settings.auth);
        save_to_querystring();
        reset_console();
    });

    $("#txt-pubchannels").change(function () {
        qc.settings.publish_channels = convert_comma_separate_to_array($(this).val());
        $("#txt-pubchannels").val(qc.settings.publish_channels.join(', '));
        $("#txt-pubchannels2").val(qc.settings.publish_channels.join(', '));
        save_to_querystring();
        reset_console();
    });

    $("#txt-pubchannels2").change(function () {
        qc.settings.publish_channels = convert_comma_separate_to_array($(this).val());
        $("#txt-pubchannels").val(qc.settings.publish_channels.join(', '));
        $("#txt-pubchannels2").val(qc.settings.publish_channels.join(', '));
        save_to_querystring();
        reset_console();
    });

    $("#button-editor-formatting").click(function(e){
        $("#editor-mod-pane").toggle();
    });

    $("#btn-publish").click(function(){
        do_publish();
    });

    $("#btn-publish-auto").click(function(){
        do_publish_auto();
    });

    $("#btn-add-channel").click(function() {
        $("#modal-add-channel").modal('hide');
        // TODO: Add Channel Subscription
    });

    $("#txt-add-channel").onEnter(function() {
        $("#modal-add-channel").modal('hide');
        // TODO: Add Channel Subscription
    });

    $("#btn-edit-channel").click(function() {
        $("#modal-edit-channel").modal('hide');
        var oc = $("#txt-edit-channel").attr("data-channel");
        var nc = $("#txt-edit-channel").val();
        var i = parseInt($("#txt-edit-channel").attr("data-index"));

        console.log(oc, nc, i);

        if (!_.isEqual(oc, nc)) {
            qc.settings.channels[i] = nc;

            // Change data attributes
            $("div.channel-container[data-index='" + i + "'] .ch-col").each(function(){
                $(this).attr("data-channel", nc);
            });

            // Change column title
            $("div.channel-container[data-index='" + i + "']").find("div.channel-name").text(nc);

            // Change Saved Channel List
            $("#txt-subchannels").val(qc.settings.channels.join(', '));

            // Change Subscription
            qc.p.subscribev2.remove_channel(oc);
            qc.p.subscribev2.add_channel(nc);
        }
    });

    $("#txt-edit-channel").onEnter(function() {
        $("#modal-edit-channel").modal('hide');
    });
    
}

function scrollX(x) {
    $('html, body').stop().animate({
        scrollLeft: (qc.settings.message_column_size - (qc.settings.message_column_size/20)) * x
    }, 1000);
}

function apply_column_widths_and_font_sizes() {
    changeCssClass(".message-font-tuner","font-size: " + (qc.settings.message_font_size) + "px");

    changeCssClass("#message-columns div.channel-container", "width: " + qc.settings.message_column_size + "px;min-width: " + qc.settings.message_column_size + "px");
    changeCssClass("#message-columns div.channel-container div.messages-outer", "width: " + qc.settings.message_column_size + "px;min-width: " + qc.settings.message_column_size + "px");
    for(var i = 0; i < 21; i++) {
        changeCssClass("#message-columns div.channel-container:nth-of-type(" + (i + 1)  + ")", "left: " + (i * qc.settings.message_column_size) + "px");
    }
    save_to_querystring();
    changeCssClass("#wrapper-scroll", "min-width: " + (600 + (qc.settings.message_column_size * qc.settings.channels.length)) + "px");
    update_scrollbars();
}

function increase_font_size() {
    ++qc.settings.message_font_size;
    apply_column_widths_and_font_sizes();
}

function decrease_font_size() {
    --qc.settings.message_font_size;
    apply_column_widths_and_font_sizes();
}

function increase_column_size() {
    qc.settings.message_column_size += 20;
    apply_column_widths_and_font_sizes();
}

function decrease_column_size() {
    qc.settings.message_column_size -= 20;
    apply_column_widths_and_font_sizes();
}

function set_preset(preset) {
    qc.settings.message_column_size = qc.presets[preset].message_column_size;
    qc.settings.message_font_size = qc.presets[preset].message_font_size;
    apply_column_widths_and_font_sizes();
}

(function($) {
    $.fn.onEnter = function(func) {
        this.bind('keypress', function(e) {
            if (e.keyCode == 13) func.apply(this, [e]);
        });
        return this;
    };
})(jQuery);

// Default Bindings for Decrypt Modal
$(function() {

    $('#modal-decrypt-passphrase').on('shown.bs.modal', function (e) {
        $("#decrypt-passphrase").focus();
    });

    $("#decrypt-passphrase").onEnter(function (e) {
        $("#btn-decrypt").focus();
        $("#btn-decrypt").click();
    });

    // This binding needs to be loaded first, rest are in console-binding.js
    $("#btn-decrypt").click(function (e) {
        decrypt_pass = (_.isEmpty($("#decrypt-passphrase").val()) ? " " : $("#decrypt-passphrase").val());

        if (decrypt_settings(decrypt_pass)) {
            $("#form-decrypt-passphrase span.form-control-feedback").addClass('sr-only');
            $("#form-decrypt-passphrase span.help-block").addClass('sr-only');
            $("#modal-decrypt-passphrase").modal('hide');
            setup_console_step2();
        }
        else {
            $("#form-decrypt-passphrase").addClass("has-error has-feedback");
            $("#form-decrypt-passphrase span.form-control-feedback").removeClass('sr-only');
            $("#form-decrypt-passphrase span.help-block").removeClass('sr-only');
            $("#decrypt-passphrase").focus();
        }
    });

    $("#decrypt-passphrase").on('keydown', function (e) {

        // keyCodes for cmd/alt/shift/capslock/arrows/tab
        var ignoreKeys = [16, 17, 18, 19, 20, 37, 38, 39, 40, 91, 93, 9];

        if (!_.includes(ignoreKeys, e.keyCode)) {
            $("#form-decrypt-passphrase").removeClass("has-error has-feedback");
            $("#form-decrypt-passphrase span.form-control-feedback").addClass('sr-only');
            $("#form-decrypt-passphrase span.help-block").addClass('sr-only');
        }
    });
});
