/*jslint browser: true*/
/*global Textual, twttr */

/* Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

var mappedSelectedUsers = [];

Textual.nicknameSingleClicked = function (e) {
    "use strict";
    this.userNicknameSingleClickEvent(e);
}

Textual.viewBodyDidLoad = function () {
    "use strict";
    Textual.fadeOutLoadingScreen(1.00, 0.95);

    window.twttr = (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
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
    setTimeout(function () {
        if (e.target.offsetHeight > (window.innerHeight - 150)) {
            e.target.style.height = (window.innerHeight - 150);
        }
    }, 1000);
}

Textual.newMessagePostedToView = function (line) {
    "use strict";
    var message, innerMessage, twitterRegex, x, link, links, twitterMatch, requestUrl, twitterRequest, getEmbeddedImages, i, len;

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

    twitterRegex = /http(s)?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9_\-]*\/status\/([0-9]*)/;

    if (innerMessage) {
        links = innerMessage.querySelectorAll("a");
        if (links) {
            for (x = 0; x < links.length; x += 1) {
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
        for (i = 0, len = getEmbeddedImages.length; i < len; i += 1) {
            getEmbeddedImages[i].onload = resizeImage;
        }
    }
    window.updateNicknameAssociatedWithNewMessage(message);
};

function updateNicknameAssociatedWithNewMessage(e) {
    "use strict";
	/* We only want to target plain text messages. */
	var elementType = e.getAttribute("ltype");
    var acceptedElementTypes = ["privmsg", "action", "notice"];
	if (acceptedElementTypes.indexOf(elementType) !== -1) {
		/* Get the nickname information. */
		var senderSelector = e.querySelector(".sender");
		if (senderSelector) {
			/* Is this a mapped user? */
			var nickname = senderSelector.getAttribute("nickname");

			/* If mapped, toggle status on for new message. */
			if (mappedSelectedUsers.indexOf(nickname) > -1) {
				toggleSelectionStatusForNicknameInsideElement(senderSelector);
			}
		}
	}
}

function toggleSelectionStatusForNicknameInsideElement(e) {
    "use strict";
	/* e is nested as the .sender so we have to go three parents
	 up in order to reach the parent div that owns it. */
	var parentSelector = e.parentNode;
    for (var i = 0; i < 4; i += 1) {
        parentSelector = parentSelector.parentNode;
     }

	parentSelector.classList.toggle("selectedUser");
}

function userNicknameSingleClickEvent(e) {
    "use strict";
	/* This is called when the .sender is clicked. */
	var nickname = e.getAttribute("nickname");
	/* Toggle mapped status for nickname. */
	var mappedIndex = mappedSelectedUsers.indexOf(nickname);

	if (mappedIndex == -1) {
		mappedSelectedUsers.push(nickname);
	} else {
		mappedSelectedUsers.splice(mappedIndex, 1);
	}

	/* Gather basic information. */
    var documentBody = document.getElementById("body_home");

    var allLines = documentBody.querySelectorAll('div[ltype="privmsg"], div[ltype="action"]');

	/* Update all elements of the DOM matching conditions. */
    for (var i = 0, len = allLines.length; i < len; i++) {
        var sender = allLines[i].querySelectorAll(".sender");

        if (sender.length > 0) {
            if (sender[0].getAttribute("nickname") === nickname) {
				toggleSelectionStatusForNicknameInsideElement(sender[0]);
            }
        }
    }
}
