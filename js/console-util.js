function highlight(block) {
    hljs.highlightBlock(block);
}

function highlight_all(){

    $('div.channel-container pre code.unformatted').each(function(i, block) {
        $(this).removeClass("unformatted");
        highlight(block);
    });
}

function convert_comma_separate_to_array(text) {
    var temp = text.split(',');
    var arr = [];

    _.forEach(temp, function(v) {
        arr.push(_.trim(v));
    });

    return _.uniq(_.compact(arr));
}

function changeCssClass(className, classValue) {
    // we need invisible container to store additional css definitions
    var cssMainContainer = $('#css-modifier-container');
    if (cssMainContainer.length == 0) {
        var cssMainContainer = $('<div id="css-modifier-container"></div>');
        cssMainContainer.hide();
        cssMainContainer.appendTo($('body'));
    }

    // and we need one div for each class
    classContainer = cssMainContainer.find('div[data-class="' + className + '"]');
    if (classContainer.length == 0) {
        classContainer = $('<div data-class="' + className + '"></div>');
        classContainer.appendTo(cssMainContainer);
    }

    // append additional style
    classContainer.html('<style>' + className + ' {' + classValue + '}</style>');
}