function insertSampleJSON(d) {
    var sample = {
        num: 5,
        float: 6.493,
        text: "this is my longer text",
        array: [
            "red", "blue", "green"
        ],
        dict: {
            item1: "item1text",
            item2: 45,
            item3: true
        }
    };
    var container = '<div class="message-content message-font-tune"><pre class="placeholder message-font-tune"><code class="unformatted json message-font-tuner">' + JSON.stringify(sample, null, '   ') + '</code></pre></div>';

    for(var i = 0; i < 10; i++) {
        var chan = "demo" + d.toString();
        $('div.channel-container[data-channel="' + chan +  '"] div.messages').append(container);
    }
}
