var url,urlParams;

function save_to_querystring() {
    enc = CryptoJS.AES.encrypt(JSON.stringify(qc.settings), qc.settings.qc_cipher);
    if (qc.settings.qc_cipher !== qc.qc_cipher) {
        enc = encodeURIComponent("PPP:" + enc.toString());
    }
    else {
        enc = encodeURIComponent(enc.toString())
    }
    url = update_querystring("t", qc.settings.console_name.replace(/ /g, "-"), url);
    url = update_querystring("qc", enc, url);
    window.history.replaceState({}, "", url);

    var share = window.location.origin + window.location.pathname + "?t=" + encodeURIComponent(qc.settings.console_name) + "qc=" + enc;
    $("#txt-shareurl").val(share);
    $("#shareurl-a").attr("href", share);
}

function decrypt_settings(passphrase) {
    passphrase = (passphrase ? passphrase : qc.qc_cipher);
    dec = CryptoJS.AES.decrypt(urlParams.qc, passphrase);
    try {
        dec = JSON.parse(dec.toString(CryptoJS.enc.Utf8));
        if (dec.qc_cipher === passphrase) {
            qc.settings = _.defaultsDeep(dec, qc.settings);
            qc.settings.uuid = "quick-console-" + (1000000 + Math.floor(Math.random() * 1000000));
            return true;
        }

        return false;
    }
    catch (e) {
        return false;
    }
}

function load_from_querystring() {
    if (_.has(urlParams, "qc")) {
        if (_.startsWith(urlParams.qc, "PPP:")) {
            urlParams.qc = urlParams.qc.split("PPP:")[1];

            // Requires Cipher Key, prompt for it
            $("#modal-decrypt-passphrase").modal('show');
            return false;
        }
        else {
            decrypt_settings();
            save_to_querystring();
            return true;
        }
    }
    else {
        console.log("fresh console");
    }
    return true;
}

function update_querystring(key, value, url) {
    if (!url) url = window.location.href;
    var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
        hash;

    if (re.test(url)) {
        if (typeof value !== 'undefined' && value !== null)
            return url.replace(re, '$1' + key + "=" + value + '$2$3');
        else {
            hash = url.split('#');
            url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
    }
    else {
        if (typeof value !== 'undefined' && value !== null) {
            var separator = url.indexOf('?') !== -1 ? '&' : '?';
            hash = url.split('#');
            url = hash[0] + separator + key + '=' + value;
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
        else
            return url;
    }
}

(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
})();

