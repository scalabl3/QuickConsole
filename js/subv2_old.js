var subscribev2 = function(args) {

    var initialized = false;

    var sub = {
        has_cb: {
            connected: false,
            disconnected: false,
            disconnect: false,
            error: false,
            presence: false
        },
        cb: {
            connected: null,
            disconnected: null,
            disconnect: null,
            error: null,
            presence: null
        },
        options: {
            ssl: false,
            origin: "pubsub.pubnub.com",
            auth: "",
            use_v2: true,
            v1_path: "/subscribe/",
            v2_path: "/v2/subscribe/"
        }
    };

    function make_url(sub, channels, tt, ssl, origin) {

        var since_tt = (_.isUndefined(tt) ? 0 : tt);

        var url1 = "http://";

        if (ssl) {
            url1 = "https://";
        }

        var channel_list = channels;

        if (_.isArray(channels)) {
            channel_list = channels.join('%2c');
        }

        return url1 += "//" + origin + "/v2/subscribe/" + sub + "/" + channel_list + "/0/" + since_tt;
    }

    function process_messages(mm, recv, message_callback) {

        //console.log(mm);

        _.forEach(mm, function (m) {
            var start = new BigNumber(m.p.t);
            var end = new BigNumber(recv);
            var dur = end.minus(start).div(100);

            var md = expand_message(m);
            var boundCallback = message_callback.bind(null, md);
            setTimeout(message_callback(md), 0);
        });

    }

    function process_payload(r, message_callback) {

        region = r.t.r;

        if (r.m.length > 0) {
            args.timetoken = r.t.t;
            process_messages(r.m, r.t.t, message_callback);
            subv2(args);
        }
        else {
            args.timetoken = r.t.t;
            subv2(args);
        }
    }

    function expand_message(m) {

        var key_map = {
            o: 'origination_timetoken',
            a: 'shard',
            b: 'subscription_match',
            c: 'channel',
            d: 'payload',
            ear: 'eat_after_reading',
            f: 'flags',
            i: 'issuing_client_id',
            k: 'subscribe_key',
            s: 'sequence_number',
            o: 'origination_timetoken',
            p: 'publish_timetoken',
            r: 'replication_map',
            u: 'user_metadata',
            t: 'timetoken',
            r: 'region_code',
            w: 'waypoint_list'
        };

        function swap(m1a) {

            var m1b = {};

            _.mapKeys(m1a, function (v, k) {
                //console.log(k,v,_.isObject(v));
                if (_.isObject(v) && !_.isArray(v) && k !== 'd') {
                    if (_.has(key_map, k)) {
                        m1b[key_map[k]] = swap(v);
                    }
                    else {
                        m1b[k] = swap(v);
                    }
                }
                else {
                    if (_.has(key_map, k)) {
                        m1b[key_map[k]] = v;
                    }
                    else {
                        m1b[k] = v;
                    }
                }
            });

            return m1b;
        }

        var m1 = {
            data: m.d,
            meta: {
                c: m.c,
                published: m.p,
                publisher: {
                    client_timestamp: _.get(m, 'o.t', null),
                    client_id: m.i,
                    client_sequence: _.get(m, 's', null)
                },
                misc: {
                    k: m.k,
                    a: m.a,
                    f: m.f
                }
            }
        };

        var m2 = swap(m1);

        return m2;
    }


    function subv2(subscribe_options) {

        // *********************************************************
        // Initiate Subscribe
        // *********************************************************

        subscribe_options.timetoken = (_.has(subscribe_options, "timetoken") ? subscribe_options.timetoken : 0);

        var url = make_url(subscribe_options.subscribe_key, subscribe_options.channel, subscribe_options.timetoken, (_.has(subscribe_options, "ssl") ? subscribe_options.ssl : false), (_.has(subscribe_options, "origin") ? subscribe_options.origin : "pubsub.pubnub.com"));

        var r = new XMLHttpRequest();
        r.responseType = "json";

        r.onreadystatechange = function() {
            switch (r.readyState) {
                case XMLHttpRequest.UNSENT:
                    //console.log("ready to connect");
                    break;
                case XMLHttpRequest.OPENED:
                    if (!initialized) {
                        console.log("Connected:", subscribe_options.channel);
                        initialized = true;
                    }
                    break;
                case XMLHttpRequest.HEADERS_RECEIVED:
                    //console.log("receiving headers");
                    break;
                case XMLHttpRequest.LOADING:
                    //console.log("receiving data");
                    break;
                case XMLHttpRequest.DONE:
                    //console.log("Done:", subscribe_options.channel);
                    break;
            }
        };

        // "http://blocks.pubnub.com/v2/subscribe/sub-c-561467ac-e163-11e5-80de-0619f8945a4f/augment2/0/14583581760409767"
        r.ontimeout = function() {
            console.log("subscribe timed out");
            r.open("GET", url);
        };
        r.onload = function() {
            //console.log(r.response);
            process_payload(r.response, subscribe_options.message);
            r.open("GET", url);
        };
        r.open("GET", url);
        r.send();

    }

    subv2(args);

};

