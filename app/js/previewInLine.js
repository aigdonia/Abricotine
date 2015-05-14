function previewInLine (cm, line, types) {
    
    function lineIsSelected (lineNumber) { // FIXME: doesnt work in case of multiple selection
        var cursor = {
            begin: doc.getCursor("from"),
            end: doc.getCursor("to")
        };
        return !(cursor.begin.line > lineNumber || cursor.end.line < lineNumber);
    }
    
    function replaceInLine (line, typeConfig) {
        var lineNumber,
            regex = typeConfig.regex,
            match,
            from,
            to,
            element,
            markOptions = typeConfig.marker,
            textMarker;
        if (typeof line === 'number') {
            lineNumber = line;
            line = doc.getLineHandle(line);
        } else {
            lineNumber = doc.getLineNumber(line);
        }
        if (lineIsSelected(lineNumber)){ return; }
        while ((match = regex.exec(line.text)) !== null) {
            from = {
                line: lineNumber,
                ch: match.index
            };
            to = {
                line: lineNumber,
                ch: from.ch + match[0].length
            };
            if (doc.findMarks(from, to).length > 0) {
                continue;
            }
            element = typeConfig.createElement(match);
            markOptions.replacedWith = element;
            textMarker = doc.markText(from, to, markOptions);
            if (typeConfig.callback && typeof typeConfig.callback === "function") {
                typeConfig.callback(textMarker, element);
            }
        }
    }
    
    var doc = cm.doc,
        config = {
            image: {
                regex: /!\[(["'-a-zA-Z0-9@:%._\+~#=\.\/! ]*)\]\(([-a-zA-Z0-9@:%_\+~#=\.\/]+\.(jpg|jpeg|png|gif|svg))(\s("|')([-a-zA-Z0-9@:%_\+~#=\.\/! ]*)("|')\s?)?\)/gi,
                createElement: function (match) {
                    var alt = match[1] || '',
                        url = match[2],
                        title = match[6],
                        $element = $('<img>').attr('src', url).attr('alt', alt);
                    if (title) {
                        $element.attr("title", title);
                    }
                    $element.error( function() {
                        $(this).replaceWith("<span class='autopreview-error'>Image not found: " + url + "</span>");
                    });
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: false,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    textMarker.on("beforeCursorEnter", function () {
                        if (!doc.somethingSelected()) { // Fix blink on selection
                            textMarker.clear();
                        }
                    });
                }
            },
            checkbox: {
                regex: /^(\*|-|\+)\s+\[(\s*|x)?\]\s+/g,
                createElement: function (match) {
                    var isChecked = match[2] === "x",
                        checkedClass = isChecked ? " checked" : "",
                        $element = $("<span class='checkbox" + checkedClass +"'></span>");
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: true,
                    handleMouseEvents: false,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    var $element = $(element);
                    $element.click( function () {
                        var pos = textMarker.find(),
                            isChecked = $(this).hasClass("checked"),
                            newText = isChecked ? "* [] " : "* [x] ";
                        doc.replaceRange(newText, pos.from, pos.to);
                        $(this).toggleClass("checked");
                    });
                }
            },
            iframe: {
                regex: /^\s*<iframe[^<>]*src=["']https?:\/\/(?:www\.)?([-a-zA-Z0-9@:%_\+~#=\.! ]*)[-a-zA-Z0-9@:%_\+~#=\.\/! ]*["'][^<>]*>\s*<\/iframe>\s*$/gi,
                createElement: function (match) {
                    var whitelist = ["youtube.com", "google.com"],
                        url = match[1],
                        allowed = false;
                    for (var i=0; i<whitelist.length; i++) {
                        if (url.trim() !== whitelist[i]) {
                            continue;
                        }
                        return $(match[0]).get(0); // TODO: maybe better/safer to reprocess an iframe from scratch ?
                    }
                },
                marker: {
                    clearOnEnter: true,
                    inclusiveLeft: false,
                    inclusiveRight: false
                }
            },
            anchor: {
                regex: /<a\s+name=["']([-a-zA-Z0-9@%_\+~#=!]+)["']\s*(\/>|>\s*<\/a>)/gi,
                createElement: function (match) {
                    var name = match[1],
                        $element = $("<a class='anchor' name='" + name + "' title='Anchor: " + name + "'></a>");
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: true,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                }
            }
            // TODO: maths
        };
    if (types === undefined || types.length === 0) {
        return;
    }
    for (var i=0; i<=types.length; i++) {
        var type = types[i];
        if (config[type]) {
            replaceInLine(line, config[type]);
        }
    }
}

module.exports = previewInLine;