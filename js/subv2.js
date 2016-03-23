function subscribeV2(args) {

    var initialized = false;

    var params = {
        has_cb: {
            connected: false,
            disconnected: false,
            reconnected: false,
            error: false,
            presence: false,
            message: false
        },
        cb: {
            connected: null,
            disconnected: null,
            reconnected: null,
            error: null,
            presence: null,
            message: function(m) { console.log("msg:", m); }
        },
        state: {
            channels: [],
            channel_groups: [],
            timetoken: 0,
            subkey: null,
            tls: false,
            origin: "pubsub.pubnub.com",
            uuid: null,
            presence_state: null,
            authkey: false,
            use_v2: true,
            v1_path: "/subscribe",
            v2_path: "/v2/subscribe",
            multiplex: true,
            status: "DISCONNECTED"
        },
        connection: null
    };

    process_args();

    /**********************************************************************/
    /* Protected - Internal Methods */
    /**********************************************************************/

    function process_args() {

        function hasCallback(name, altName) {

            altName = (altName ? altName : name);

            if (_.has(args, name) || _.has(args, altName)) {
                if (_.isFunction(args[name])) {
                    params.cb[name] = args[name];
                    params.has_cb[name] = true;
                }
                else if (_.isFunction(args[altName])) {
                    params.cb[name] = args[altName];
                    params.has_cb[name] = true;
                }
            }
            else {

                params.has_cb[name] = false;
            }
        }

        function hasStateProperty(name, altName) {

            altName = (altName ? altName : name);

            if (_.has(args, name)) {
                params.state[name] = args[name];
            }
            else if (_.has(args, altName)) {
                params.state[name] = args[altName]
            }
        }

        hasCallback("connected", "connect");
        hasCallback("disconnected", "disconnect");
        hasCallback("reconnected", "reconnect");
        hasCallback("message", "callback");
        hasCallback("presence", "presence");
        hasCallback("error");

        hasStateProperty("subkey");
        hasStateProperty("origin");
        hasStateProperty("timetoken");
        hasStateProperty("authkey");
        hasStateProperty("tls", "ssl");
        hasStateProperty("uuid");
        hasStateProperty("presence_state", "state")
    }

    function make_url() {

        var querystring = [];

        var url = (params.state.tls ? "http://" : "https://");

        url += "//" + params.state.origin;
        url += (use_v2 ? params.state.v2_path : params.state.v1_path);
        url += "/" + params.state.subkey;
        url += "/" + params.state.channels.join('%2c');
        url += "/0/" + params.state.timetoken;

        if (!_.isEmpty(params.state.authkey)) {
            querystring.push(["auth", params.state.authkey]);
        }

        if (!_isEmpty(params.state.uuid)) {
            querystring.push(["uuid", params.state.uuid]);
        }

        if (!_isEmpty(params.state.presence_state)) {
            querystring.push(["state", params.state.presence_state]);
        }

        if (!_isEmpty(params.state.channel_groups)) {
            querystring.push(["channel-groups", params.state.channel_groups.join("%2c")]);
        }

        if (querystring.length > 0) {
            url += "?";
            for (i in querystring) {
                var param = querystring[i];
                if (i > 0) {
                    url += "&";
                }
                url += param[0] + "=" + param[1];
            }
        }

        return url;
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
            subscribe();
        }
        else {
            args.timetoken = r.t.t;
            subscribe();
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

    function subscribe() {

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

        params.connection = r;

        params.connection.open("GET", url);
        params.connection.send();

    }


    /**********************************************************************/
    /* Public - External Methods */
    /**********************************************************************/

    return {
        connect: function() {
            subscribe();
        },
        reconnect: function() {
            unsubscribe_all();
            subscribe();
        },
        add_channel: function(channel) {

        },
        remove_channel: function(channel) {

        },
        unsubscribe: function(channel) {

        },
        unsubscribe_all: function() {

        },
        get_state: function() {

        },
        set_state_item: function(item, value) {

        },
        set_authkey: function() {

        },
        addEventListener: function() {

        },
        removeEventListener: function() {

        }
    };
}


