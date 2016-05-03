function setup_publish_editor() {
    editor = ace.edit("jsoneditor");
    var JSONmode = ace.require("ace/mode/json").Mode;
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode(new JSONmode());
    editor.$blockScrolling = Infinity;

    update_sample_json('empty');
    update_sample_json('translation');
    update_sample_json('timestamp');
    update_sample_json('sequence');
    update_sample_json('geo');
}

function update_sample_json(type, current) {
    var json;

    json = (current ? current : {});

    if (type === 'empty') {
        json = {};
    }
    else {
        json = JSON.parse(editor.getValue());
    }

    if (type === "translation") {
        json.text = "The green monkey bought a ripe yellow banana.";
        json = _.defaultsDeep(json, { meta: { auto_translate: { lang: { from: "en", to: "fr,es,it" }, field: "text" } } });
    }

    if (type === 'timestamp') {
        json = _.defaultsDeep(json, { meta: { auto_timestamp: Date.now() } } );
        json.meta.auto_timestamp = Date.now();
    }

    if (type === 'sequence') {
        json = _.defaultsDeep(json, { meta: { auto_sequence: 0 } } );
        json.meta.auto_sequence = json.meta.auto_sequence + 1;
    }

    if (type === "geo") {
        json = _.defaultsDeep(json, { meta: { auto_geo: { latitude: 0, longitude: 0 } } });

        if (_.has(json, "meta.auto_geo")) {
            json.meta.auto_geo.latitude = sample_geo[_.random(605,805)].latitude;
            json.meta.auto_geo.longitude = sample_geo[_.random(605,805)].longitude;
        }
    }


    if (type === "update") {

        if (_.has(json, "meta.timestamp")) {
            json.meta.auto_timestamp = Date.now()
        }
        if (_.has(json, "meta.auto_sequence")) {
            json.meta.auto_sequence = json.meta.auto_sequence + 1;
        }
        if (_.has(json, "meta.auto_geo")) {
            json.meta.auto_geo.latitude = sample_geo[_.random(605,805)].latitude;
            json.meta.auto_geo.longitude = sample_geo[_.random(605,805)].longitude;
        }

    }

    editor.setValue(JSON.stringify(json, null, "  "));

}

function update_scrollbars() {
    $("div.messages-outer").perfectScrollbar('update');
    $('body').perfectScrollbar('update');
}

function setup_subscribe_columns() {

    changeCssClass("#wrapper-scroll", "min-width: " + (600 + (qc.settings.message_column_size * qc.settings.channels.length)) + "px");

    _.forEach(qc.settings.channels, function (channel, k) {

        if ($("div.channel-container[data-channel='" + channel + "']").length) {
            // column exists already
        }
        else {
            var html = '' +
                '<div class="channel-container dtcell ch-col" data-channel="' + channel + '" data-index="' + k + '">' +
                '<div class="channel-header message-header-font-tuner">' +
                '<div class="channel-name">' + channel + '</div>' +
                '<div class="pull-right message-header-font-tuner-toggle">' +
                '<i class="fa fa-edit ch-col ch-btn ch-edit" style="margin-right: 68px" data-op="edit" data-channel="' + channel + '" data-index="' + k + '"></i>' +
                '<i class="fa fa-arrow-circle-left ch-col ch-btn ch-move-left" style="margin-right: 47px" data-op="left" data-channel="' + channel + '" data-index="' + k + '"></i>' +
                '<i class="fa fa-arrow-circle-right ch-col ch-btn ch-move-right" style="margin-right: 26px" data-op="right" data-channel="' + channel + '" data-index="' + k + '"></i>' +
                '<i class="fa fa-trash ch-col ch-btn ch-remove" style="margin-right: 5px" data-op="remove" data-channel="' + channel + '" data-index="' + k + '"></i>' +
                //'<i class="fa fa-circle-o-notch fa-spin on toggler"></i>' +
                '</div>' +
                '</div>' +
                '<div class="messages-outer ch-col" data-index="' + k + '"><div class="messages ch-col" data-index="' + k + '"></div></div>' +
                '</div>';

            $("#message-columns").append(html);


            html = '' +
                '<li>' +
                '<button href="/" onclick="scrollX(' + (k + 1) + ')" class="tooltipper quick-nav" title="' + channel + ' [CTRL-' + (k + 2) + ']">' +
                '<span class="fa-stack fa-1x">' +
                '<i class="fa fa-square fa-stack-2x"></i>' +
                '<strong class="fa-stack-1x channel-button">' + (k + 1) + '</strong>' +
                '</span>' +
                '</button>' +
                '</li>';

            $('#quick-nav-add-channel').before(html);
            $("#quick-nav-buttons li a.quick-nav").click(function (e) {
                e.preventDefault();
            });
        }
    });

    _.forEach(qc.settings.channels, function (v, k) {
        $("div.channel-container[data-channel='" + v + "'] div.messages-outer").perfectScrollbar({
            suppressScrollX: true
        });
    });

    bind_column_buttons();
}

function sort_subscribe_columns() {

}

function remove_subscribe_columns() {

}