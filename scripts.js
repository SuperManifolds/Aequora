/*jslint browser: true*/
/*global Textual, twttr */

/* Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

var mappedSelectedUsers = [];
var previousNick = '', previousNickCount = 1, previousNickMessageId, previousNickDelete = false;

Textual.nicknameSingleClicked = function (e) {
    "use strict";
    this.userNicknameSingleClickEvent(e);
};

Textual.viewBodyDidLoad = function () {
    "use strict";
    Textual.fadeOutLoadingScreen(1.00, 0.95);

    window.twttr = (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
        if (d.getElementById(id)) {
            return t;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.twitter.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);
        t.e = [];
        t.ready = function (f) {
            t.e.push(f);
        };
        return t;
    }(document, "script", "twitter-wjs"));
    setTimeout(function () {
        Textual.scrollToBottomOfView();
    }, 500);
};

function resizeImage(e) {
    "use strict";
    function resizeAtInterval() {
        if (e.target.offsetHeight > (window.innerHeight - 150)) {
            e.target.style.height = (window.innerHeight - 150);
        }
    }
    setTimeout(resizeAtInterval, 1000);
}

Textual.newMessagePostedToView = function (line) {
    "use strict";
    var message, innerMessage, twitterRegex, x, link, links, twitterMatch, requestUrl, twitterRequest, getEmbeddedImages, i, len, linksLen, selectNick, nickElement;

    function twitterWidgetLoaded() {
        var container = document.createElement("div");
        container.innerHTML = JSON.parse(twitterRequest.responseText).html;

        innerMessage.appendChild(container);
        twttr.widgets.load();
    }

    message = document.getElementById('line-' + line);
    innerMessage = message.querySelector(".innerMessage");

    if (message.getAttribute("encrypted") === "true") {
        if (innerMessage.innerText.indexOf("+OK") !== -1) {
            message.setAttribute("encrypted", "failed");
        }
    }

    /* The following is the intellectual property of April King, see LICENSE.md for more information */

    // reset the message count and previous nick, when you rejoin a channel
    if (message.getAttribute('ltype') !== 'privmsg') {
        previousNick = '';
        previousNickCount = 1;
    }

    if (message.getAttribute('ltype') === 'privmsg' || message.getAttribute('ltype') === 'action') {
        selectNick = message.querySelector(".sender");

        // Delete the previous line's nick, if it was set to be deleted
        if (previousNickDelete === true) {
            nickElement = document.getElementById(previousNickMessageId).getElementsByClassName('sender')[0];
            nickElement.classList.add("f");
            nickElement.style.color = window.getComputedStyle(nickElement).backgroundColor;
        }

        // Track the nicks that submit messages, so that we can space out everything
        if ((previousNick === selectNick.innerHTML) && (previousNickCount < 10) && (message.getAttribute('ltype') !== 'action')) {
            previousNickDelete = true;
            previousNickCount += 1;
        } else {
            previousNick = selectNick.innerHTML;
            previousNickCount = 1;
            previousNickDelete = false;
        }

        // Track the previous message's id
        previousNickMessageId = message.getAttribute('id');
    }

    /* --------------------------------------------------------------------------------------------------------------------------------------*/

    twitterRegex = /http(s)?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9_\-]*\/status\/([0-9]*)/;

    if (innerMessage) {
        links = innerMessage.querySelectorAll("a");
        if (links) {
            linksLen = links.length;
            for (x = 0; x < linksLen; x += 1) {
                link = links[x].getAttribute("href");

                twitterMatch = twitterRegex.exec(link);
                if (twitterMatch !== null) {
                    requestUrl = "https://api.twitter.com/1/statuses/oembed.json?id=" + twitterMatch[3] + "&url=" + encodeURIComponent(twitterMatch[0]) + "&hide_thread=true&omit_script=true&theme=dark";
                    twitterRequest = new XMLHttpRequest();
                    twitterRequest.open("GET", requestUrl, true);
                    twitterRequest.onload = twitterWidgetLoaded;
                    twitterRequest.send();
                }
            }
        }
    }

    getEmbeddedImages = message.querySelectorAll("img");
    if (getEmbeddedImages) {
        len = getEmbeddedImages.length;
        for (i = 0; i < len; i += 1) {
            getEmbeddedImages[i].onload = resizeImage;
        }
    }
    this.updateNicknameAssociatedWithNewMessage(message);
};

function toggleSelectionStatusForNicknameInsideElement(e) {
    "use strict";
    var i, parentSelector = e.parentNode;

    /* e is nested as the .sender so we have to go three parents
    up in order to reach the parent div that owns it. */
    for (i = 0; i < 3; i += 1) {
        parentSelector = parentSelector.parentNode;
    }

    parentSelector.classList.toggle("selectedUser");
}

function updateNicknameAssociatedWithNewMessage(e) {
    "use strict";
    var elementType, acceptedElementTypes, senderSelector, nickname;
    /* We only want to target plain text messages. */
    elementType = e.getAttribute("ltype");
    acceptedElementTypes = ["privmsg", "action", "notice"];
    if (acceptedElementTypes.indexOf(elementType) !== -1) {
        /* Get the nickname information. */
        senderSelector = e.querySelector(".sender");
        if (senderSelector) {
            /* Is this a mapped user? */
            nickname = senderSelector.getAttribute("nickname");

            /* If mapped, toggle status on for new message. */
            if (mappedSelectedUsers.indexOf(nickname) > -1) {
                toggleSelectionStatusForNicknameInsideElement(senderSelector);
            }
        }
    }
}

function userNicknameSingleClickEvent(e) {
    "use strict";
    var nickname, mappedIndex, i, len, documentBody, allLines, sender;

    /* This is called when the .sender is clicked. */
    nickname = e.getAttribute("nickname");
    /* Toggle mapped status for nickname. */
    mappedIndex = mappedSelectedUsers.indexOf(nickname);

    if (mappedIndex === -1) {
        mappedSelectedUsers.push(nickname);
    } else {
        mappedSelectedUsers.splice(mappedIndex, 1);
    }

    /* Gather basic information. */
    documentBody = document.getElementById("body_home");

    allLines = documentBody.querySelectorAll('div[ltype="privmsg"], div[ltype="action"]');

    /* Update all elements of the DOM matching conditions. */
    len = allLines.length;
    for (i = 0; i < len; i += 1) {
        sender = allLines[i].querySelectorAll(".sender");

        if (sender.length > 0) {
            if (sender[0].getAttribute("nickname") === nickname) {
                toggleSelectionStatusForNicknameInsideElement(sender[0]);
            }
        }
    }
}
