Array.prototype.toBracketString = function() {
    return "[" + this.join(", ") + "]";
};

function SubscribeV2(args) {

    var INFO = 1;
    var WARN = 2;
    var ERROR = 4;
    
    var params = {
        has_cb: {
            connected: false,
            disconnected: false,
            reconnected: false,
            error: false,
            presence: false,
            message: true
        },
        cb: {
            connected: null,
            disconnected: null,
            reconnected: function() {
                if (params.debug & INFO) {
                    console.info("Subscribe:", reconnected);
                }
            },
            error: null,
            presence: null,
            message: {
                default: function(m) { console.log("Received:", m); }
            }
        },
        state: {
            channels: [],
            channel_groups: [],
            suburl: null,
            timetoken: 0,
            subkey: null,
            tls: false,
            origin: "pubsub.pubnub.com",
            uuid: null,
            presence_state: null,
            useauthkey: false,
            authkey: '',
            use_v2: true,
            v1_path: "/subscribe",
            v2_path: "/v2/subscribe",
            multiplex: true,
            status: "DISCONNECTED",
            start: null,
            connected: false
        },
        connection: [],
        resub_debounce: null,
        resub_debounce_time: 300,
        debug: (INFO + WARN + ERROR)

    };

    process_args();

    function create_uuid() {
        return "quick-console-" + (1000000 + Math.floor(Math.random() * 1000000));
    }

    function check_internet(callback) {
        var x = new XMLHttpRequest();
        var url = "http://pubsub.pubnub.com/time/0?uuid=" + params.state.uuid;

        x.addEventListener("load", function(){
            console.info("Check Internet: LOAD");
            callback(true);
        });
        x.addEventListener("error", function(e){
            console.info("Check Internet: ERROR", e);
            callback(false);
        });
        x.addEventListener("abort", function(e){
            console.info("Check Internet: ABORT", e);
            callback(false);
        });
        x.open("GET", url);
        x.send();
    }

    /**********************************************************************/
    /* Protected - Internal Methods */
    /**********************************************************************/

    function process_args() {

        function hasCallback(name, altName, target) {

            altName = (altName ? altName : name);

            if (_.has(args, name) || _.has(args, altName)) {
                if (_.isFunction(args[name])) {
                    if (_.isEmpty(target)) {
                        params.cb[name] = args[name];
                    }
                    else {
                        params.cb[name][target] = args[name];
                    }
                    params.has_cb[name] = true;
                }
                else if (_.isFunction(args[altName])) {
                    if (_.isEmpty(target)) {
                        params.cb[name] = args[name];
                    }
                    else {
                        params.cb[name][target] = args[name];
                    }
                    params.has_cb[name] = true;
                }
            }
            else {

                params.has_cb[name] = false;
            }
        }

        function hasStateProperty(name, altName) {

            name = name.toLowerCase();
            altName = (altName ? altName.toLowerCase() : name.toLowerCase());

            if (_.has(args, name)) {
                params.state[name] = args[name];
            }
            else if (_.has(args, altName)) {
                params.state[name] = args[altName]
            }
        }

        function hasConfigProperty(name, altName) {

            name = name.toLowerCase();
            altName = (altName ? altName.toLowerCase() : name.toLowerCase());

            if (_.has(args, name)) {
                params[name] = args[name];
            }
            else if (_.has(args, altName)) {
                params[name] = args[altName]
            }
        }

        hasCallback("connected", "connect");
        hasCallback("disconnected", "disconnect");
        hasCallback("reconnected", "reconnect");
        hasCallback("message", "callback", "default");
        hasCallback("presence", "presence");
        hasCallback("error");

        hasStateProperty("subkey", "subscribe_key");
        hasStateProperty("origin");
        hasStateProperty("timetoken");
        hasStateProperty("authkey");
        hasStateProperty("tls", "ssl");
        hasStateProperty("uuid");
        hasStateProperty("presence_state", "state");

        hasConfigProperty("resub_debounce_time");
        hasConfigProperty("debug");

        if (_.isEmpty(params.state.uuid)) {
            params.state.uuid = create_uuid();
        }
    }

    function make_url() {

        var querystring = [];

        var url = (params.state.tls ? "https://" : "http://");

        url += "//" + params.state.origin;
        url += (params.state.use_v2 ? params.state.v2_path : params.state.v1_path);
        url += "/" + params.state.subkey;
        url += "/" + params.state.channels.join('%2c');
        url += "/0/" + params.state.timetoken;

        if (!_.isEmpty(params.state.authkey)) {
            querystring.push(["auth", params.state.authkey]);
        }

        if (!_.isEmpty(params.state.uuid)) {
            querystring.push(["uuid", params.state.uuid]);
        }

        if (!_.isEmpty(params.state.presence_state)) {
            querystring.push(["state", params.state.presence_state]);
        }

        if (!_.isEmpty(params.state.channel_groups)) {
            querystring.push(["channel-groups", params.state.channel_groups.join("%2c")]);
        }

        querystring.push(["t", params.state.timetoken]);


        if (querystring.length > 0) {
            url += "?";
            for (i in querystring) {
                var param = querystring[i];
                if (!_.isEmpty(param) && !_.isEmpty(param[0]) && !_.isEmpty(param[1])) {
                    if (i > 0) {
                        url += "&";
                    }
                    url += param[0] + "=" + param[1];
                }

            }
        }

        params.state.url = url;
    }

    function process_messages(mm, recv, message_callback) {

        if (params.debug & INFO) {
            console.info("Subscribe:", "message(s) received");
        }

        _.forEach(mm, function (m) {
            var start = new BigNumber(m.p.t);
            var end = new BigNumber(recv);
            var dur = end.minus(start).div(100);

            var msg = expand_message(m);

            var cb = null;
            var bound_cb = null;

            if (_.has(params.cb.message, msg.meta.channel)) {
                cb = params.cb.message[msg.meta.channel];
                bound_cb = cb.bind(null, msg);
            }
            else {
                cb = params.cb.message.default;
                bound_cb = cb.bind(null, msg);
            }

            setTimeout(cb(msg), 0);
        });

    }

    function process_payload(rs) {

        if (!_.isEmpty(rs)) {

            params.state.region = rs.t.r;
            params.state.timetoken = rs.t.t;

            if (rs.m.length > 0) {
                process_messages(rs.m, rs.t.t);
                //subscribe();
            }

            // console.log(rs.t.t);
            make_url();
            // console.log(params.state.timetoken);
        }
        else {
            //console.log(rs);
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

    function unsubscribe() {
        if (!_.isEmpty(params.connection[0]) && !_.isEqual(params.connection[0].state, XMLHttpRequest.UNSENT)) {
            params.connection[0].abort();
        }
    }

    // added debounce so you can add/remove channels within 300 ms before resubscribe is triggered
    function resubscribe() {
        clearTimeout(params.resub_debounce);
        params.resub_debounce = setTimeout(function(){
            unsubscribe();
            subscribe();
        }, params.resub_debounce_time);
    }

    function get_timetoken() {
        return params.state.timetoken;
    }

    function get_channels() {
        return params.state.channels;
    }

    function get_channel_groups() {
        return params.state.channel_groups;
    }

    function subscribe(is_reconnect) {

        is_reconnect = (_.isEmpty(is_reconnect) ? is_reconnect : false);

        // *********************************************************
        // Initiate Subscribe
        // *********************************************************

        var r = new XMLHttpRequest();

        r.responseType = "json";

        r.onreadystatechange = function() {
            switch (r.readyState) {
                case XMLHttpRequest.UNSENT:
                    //console.log("ready to connect");
                    break;
                case XMLHttpRequest.OPENED:
                    if (true || !params.state.connected) {
                        if (params.debug & INFO) {
                            console.info("Subscribe:", (is_reconnect ? "reconnected" : "connected"), "[" + get_channels().join(', ') + "]", "[" + get_channel_groups().join(', ') + "]", "<" + get_timetoken() + ">");
                        }
                        params.state.connected = true;
                        params.state.start = Date.now();
                        is_reconnect = false;
                    }
                    break;
                case XMLHttpRequest.HEADERS_RECEIVED:
                    params.state.connected = true;
                    //console.log("receiving headers");
                    break;
                case XMLHttpRequest.LOADING:
                    params.state.connected = true;
                    //console.log("receiving data");
                    break;
                case XMLHttpRequest.DONE:
                    //console.log("Done:", this.status, this);
                    break;
            }
        };

        //params.connection.timeout = 5 * 60 * 1000; // 5 mins * 60 seconds * 1000 milli

        // "http://blocks.pubnub.com/v2/subscribe/sub-c-561467ac-e163-11e5-80de-0619f8945a4f/augment2/0/14583581760409767"
        r.ontimeout = function(e) {
            if (params.debug & INFO) {
                console.info("Subscribe:", "Connection timed out", e);
            }
            params.state.connected = false;
            subscribe(true);
        };
        r.onload = function() {
            params.state.connected = false;
            //console.log(r, r.status, r.statusText);
            if (r.status === 200) {
                process_payload(r.response);
                //console.log("success", r.readyState, params.state.timetoken);
                subscribe(true);
            }
            else if (r.status === 403) {
                if (params.debug & ERROR) {
                    console.error("Subscribe:", "permission denied for one or more channels and/or channel groups", { channels: params.state.channels, channel_groups: params.state.channel_groups });
                }
            }
            else if (r.status === 500) {
                if (params.debug & ERROR) {
                    console.error("Subscribe:", "server side error", r.statusText);
                }
            }
        };
        r.onabort = function() {
            params.state.connected = false;
            if (params.debug & INFO) {
                console.info("Subscribe:", "unsubscribe - connection terminated,", "lan connected:", navigator.onLine);
            }
            //check_internet();
            subscribe(true);
        };
        r.onerror = function(e) {

            if (params.debug & ERROR) {
                console.error("Subscribe:", "ERROR", "- loss of connectivity or other error", e);
            }

            // Safari workaround to keep checking connection every attempt * 1 second (linear backoff), max 5 attempts
            var attempt = 0;
            var max = 60; //  Arithmetic Progression (30 mins total), each attempt 1 second longer than last

            function recheck() {

                setTimeout(function () {
                    if (attempt < max) {
                        check_internet(function (result) {
                            attempt += 1;
                            if (result) {
                                console.info("Subscribe:", "RESTABLISH", "on attempt", attempt);
                                attempt = max;
                                subscribe(true);
                            }
                            else {
                                recheck();
                            }
                        });
                    }
                    else {
                        console.error("Subscribe:", "ERROR - 60 attempts to reestablish connection (1830 seconds total)");
                    }
                }, attempt * 1000);
            }
            recheck();

        };

        params.connection.unshift(r);

        make_url();
        r.open("GET", params.state.url + "&ttt=" + Date.now());

        // Causes CORS error on GET Requests
        // r.setRequestHeader('Content-Type', 'application/json;charset=utf-8')

        try {
            r.send();
        }
        catch(e) {
            console.log("error caught");
        }


    }


    /**********************************************************************/
    /* Public - External Methods */
    /**********************************************************************/

    return {
        INFO: INFO,
        WARN: WARN,
        ERROR: ERROR,
        connect: function() {
            resubscribe();
        },
        reconnect: function() {
            resubscribe();
        },
        disconnect: function() {
            unsubscribe();
        },
        add_channel: function(channels) {

            var is_changed = false;
            var new_channels = [];
            var cur_channels = [];
            var current_channels = _.clone(params.state.channels);

            if (!_.isArray(channels)) {
                channels = _.compact(channels.replace(/ /g, "").split(','));
            }

            _.forEach(channels, function(ch){
                ch = _.trim(ch);
                if (_.indexOf(params.state.channels, ch) < 0) {
                    new_channels.push(ch);
                    is_changed = true;
                }
                else {
                    cur_channels.push(ch);
                }
            });


            var result = {
                api: "subscribe",
                action: "add channel",
                param: channels,
                changed: is_changed,
                result: {
                    before: current_channels,
                    after: params.state.channels
                },
                added: (_.isEmpty(new_channels) ? null : new_channels),
                inapplicable: (_.isEmpty(cur_channels) ? null : cur_channels)
            };

            if (is_changed) {
                result.result.after = params.state.channels = _.union(params.state.channels, new_channels);

                if (params.debug & INFO) {
                    //console.info("Subscribe:", current_channels.toBracketString(), "+", channels.toBracketString(), "=", params.state.channels.toBracketString(), (cur_channels.length > 0 ? "  :::  N/A: +" + cur_channels.toBracketString() : ""));
                    console.info("Subscribe Change:", result);
                }

                if (params.state.connected) {
                    resubscribe();
                }
            }
            else {
                if (params.debug & WARN) {
                    //console.warn("No Change:", current_channels.toBracketString(), "+", channels.toBracketString(), "=", params.state.channels.toBracketString(), (cur_channels.length > 0 ? "  :::  N/A: +" + cur_channels.toBracketString() : ""));
                    console.warn("Subscribe Change:", result);
                }
            }

        },
        remove_channel: function(channels) {

            var is_changed = false;
            var nix_channels = []; // channels found to be removed
            var nil_channels = []; // channels not found in subscribe list
            var current_channels = _.clone(params.state.channels);

            if (!_.isArray(channels)) {
                channels = _.compact(channels.replace(/ /g, "").split(','));
            }

            _.forEach(channels, function(ch){
                ch = _.trim(ch);
                if (_.indexOf(params.state.channels, ch) >= 0) {
                    nix_channels.push(ch);
                    is_changed = true;
                }
                else {
                    nil_channels.push(ch);
                }
            });

            var result = {
                api: "subscribe",
                action: "remove channel",
                param: channels,
                changed: is_changed,
                result: {
                    before: current_channels,
                    after: params.state.channels
                },
                removed: (_.isEmpty(nix_channels) ? null : nix_channels),
                inapplicable: (_.isEmpty(nil_channels) ? null : nil_channels)
            };

            if (is_changed) {
                result.result.after = params.state.channels = _.xor(params.state.channels, nix_channels);

                if (params.debug & INFO) {
                    //console.info("Subscribe:", current_channels.toBracketString(), "-", channels.toBracketString(), "=", params.state.channels.toBracketString(), (nil_channels.length > 0 ? " :::  N/A: -" + nil_channels.toBracketString() : ""));
                    console.info("Subscribe Change:", result);
                }

                if (params.state.connected) {
                    resubscribe();
                }
            }
            else {
                if (params.debug & WARN) {
                    //console.warn("No Change:", current_channels.toBracketString(), "-", channels.toBracketString(), "=", params.state.channels.toBracketString(), (nil_channels.length > 0 ? " :::  N/A: -" + nil_channels.toBracketString() : ""));
                    console.warn("Subscribe Change:", result);
                }
            }

        },
        get_state: function() {
            return params.state;
        },
        get_connection: function() {
            return params.connection;
        },
        set_state_item: function(item, value) {

        },
        set_authkey: function(auth) {
            if (!_.isEqual(params.state.authkey,auth)) {
                params.state.authkey = auth;
                resubscribe();
            }
            else {
                console.info("Subscribe:", "set authkey - authkey already current");
            }
        },
        add_message_handler: function(channel, f) {

        },
        remove_message_handler: function(channel, index, all_handlers) {

        },
        add_event_listener: function(id, event, f) {

        },
        remove_event_listener: function(id, event, f) {

        },
        list_event_listeners: function(event) {

        },
        params: function() {
            return params;
        }
    };
}
