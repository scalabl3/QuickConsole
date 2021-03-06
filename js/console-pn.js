function do_pn_init() {
    qc.p = null;
    qc.p2 = null;

    qc.p = PUBNUB.init({
        origin: qc.settings.origin,
        publish_key: qc.settings.pubkey,
        subscribe_key: qc.settings.subkey,
        uuid: qc.settings.uuid,
        ssl: true,
        auth_key: qc.settings.auth
    });

    qc.p2 = PUBNUB.init({
        publish_key: qc.settings.pubkey,
        subscribe_key: qc.settings.subkey,
        uuid: qc.settings.uuid,
        ssl: true,
        auth_key: qc.settings.auth
    });

    qc.p.flex_history = pubnub_flex_history;
}

console.log('hi');

function do_subscribe(history_first) {

    history_first = (history_first ? true : false);

    qc.p.subscribev2 = new SubscribeV2({
        subscribe_key: qc.settings.subkey,
        ssl: qc.settings.ssl,
        origin: qc.settings.origin,
        authkey: qc.settings.auth,
        message: function(msg) {
            console.log("\n\n\n\n");
            console.log("msg:",msg.meta.channel, msg.meta.subscription_match, msg);
            var content = "";
            var id = 1000000 + Math.floor(Math.random()*1000000);

            content += '<div class="message-content " data-id="' + id + '" style="">';
            content += '<div class="message-header">';
            content += '<div class="published">p: ' + msg.meta.published.timetoken + ' [' + msg.meta.channel + ']</div>';
            content += '</div>';
            content += '<div class="message-body message-font-tuner">';
            content += '<pre><code class="unformatted json">' + JSON.stringify(msg.data, null, '   ') + '</code></pre>';
            content += '</div>';
            content += '<div class="message-footer">';
            content += '<div class="publisher">' + msg.meta.publisher.client_id + '</div>';
            content += '</div>';
            content += '</div>';

            var e1 = $("div.channel-container[data-channel='" + msg.meta.subscription_match + "'] div.messages");
            var e2 = $("div.channel-container[data-channel='" + msg.meta.subscription_match + "'] div.messages-outer");

            e1.append(content);
            highlight_all();

            setTimeout(function(){
                //console.log(e2.prop("scrollTop"), e2.prop("scrollHeight"));
                e2.animate({ scrollTop: e2.prop("scrollHeight") });
                e2.perfectScrollbar('update');
            }, 200);
        },
        connect: function() {
            console.log("Connected to ", ch);
        }
    });
    qc.p.subscribev2.add_channel(qc.settings.channels);
    qc.p.subscribev2.connect();
}



function do_publish(isAuto) {

    isAuto = (isAuto ? isAuto : false);

    var msg = JSON.parse(editor.getValue());

    if (isAuto) {
        msg.meta.auto_publish = true;
        msg.meta.auth_publish_count = qc.auto_publish_count;
    }

    _.forEach(qc.settings.publish_channels, function(channel, k) {
        qc.p.publish({
            channel: channel,
            message: msg,
            callback: function (m) {
                //console.log("pub:", m);
                update_sample_json('update', msg);
            },
            error: function (e) {
                console.log("err:", e);
            }
        });
    });
}

function do_publish_auto() {

    if (_.isNil(qc.auto_pub)) {

        qc.auto_publish_count = 1;

        do_publish();

        qc.auto_pub = setInterval(function () {
            if (qc.auto_publish_count < 10) {
                do_publish(true);
                qc.auto_publish_count++;
            }
            else {
                // call it again so that it clears Interval
                do_publish_auto();
            }
        }, qc.settings.auto_publish_interval);

        qc.settings.auto_publish = true;
        save_to_querystring();

        console.log("auto-publish started", "[ 10 total, 1 every " + _.truncate(qc.settings.auto_publish_interval / 1000) + " seconds]");
        $("#btn-publish-auto").toggleClass("btn-default btn-success btn-on");
    }
    else {
        clearInterval(qc.auto_pub);
        qc.auto_pub = null;
        qc.settings.auto_publish = false;
        save_to_querystring();

        console.log("auto-publish ended");
        $("#btn-publish-auto").toggleClass("btn-default btn-success btn-on");
    }
}






