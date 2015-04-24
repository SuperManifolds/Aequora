/* jslint browser: true */
/* global Textual */

/* Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

var mappedSelectedUsers = new Array();
var emotes = null;

Textual.viewBodyDidLoad = function() {
    Textual.fadeOutLoadingScreen(1.00, 0.95);

    var emoteRequest = new XMLHttpRequest();
    emoteRequest.open("GET", "http://twitchemotes.com/api_cache/v2/global.json", true);
    emoteRequest.onload = function() {
        emotes = JSON.parse(emoteRequest.responseText);
    }
    emoteRequest.send();

    window.twttr = (function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0],
    t = window.twttr || {};
  if (d.getElementById(id)) return t;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);

  t._e = [];
  t.ready = function(f) {
    t._e.push(f);
  };

  return t;
}(document, "script", "twitter-wjs"));

    setTimeout(function() {
        Textual.scrollToBottomOfView();
    }, 500);
};

Textual.newMessagePostedToView = function (line) {
    var message = document.getElementById('line-' + line);
    var innerMessage = message.querySelector(".innerMessage");
    if (message.getAttribute("encrypted") === "true") {
        if (innerMessage.innerText.indexOf("+OK") !== -1) {
            message.setAttribute("encrypted", "failed");
        }
    }

    var twitterRegex = /http(s)?:\/\/(www.)?twitter.com\/[A-Za-z0-9_-]*\/status\/([0-9]*)/;
    var redditRegex = /http(s)?:\/\/([A-Za-z0-9_.]*)reddit.com\/r\/[A-Za-z0-9_-]*\/comments\/[A-Za-z0-9]*\/[A-Za-z0-9_]*\/[A-Za-z0-9]*/;

    if (innerMessage) {
        if (emotes) {
            var messageText = innerMessage.innerHTML;
            messageText.split(' ').forEach(function(word) {
                word = word.trim();
                if (emotes.emotes[word]) {
                    var emote = emotes.emotes[word];
                    var emoticon = document.createElement("img");
                    emoticon.setAttribute("alt", word);
                    emoticon.setAttribute("src", "https://static-cdn.jtvnw.net/emoticons/v1/" + emote.image_id + "/1.0");
                    emoticon.style.display = "inline-block";

                    messageText = messageText.replace(new RegExp("\\b" + word + "\\b", "g"), emoticon.outerHTML);
                }
            });
            innerMessage.innerHTML = messageText;
        }

        var links = innerMessage.querySelectorAll("a");
        if (links) {
            for (var x = 0; x < links.length; x++) {
                var link = links[x].getAttribute("href");

                var twitterMatch = twitterRegex.exec(link);
                if (twitterMatch != null) {
                    var requestUrl = "https://api.twitter.com/1/statuses/oembed.json?id=" + twitterMatch[3] + "&url=" + encodeURIComponent(twitterMatch[0]) + "&hide_thread=true&omit_script=true&theme=dark";
                    var twitterRequest = new XMLHttpRequest();
                    twitterRequest.open("GET", requestUrl, true);
                    twitterRequest.onload = function() {
                        var container = document.createElement("div");
                        container.innerHTML = JSON.parse(twitterRequest.responseText).html;

                        innerMessage.appendChild(container);
                        twttr.widgets.load();
                    }
                    twitterRequest.send();//
                }
            }
        }


    }

    var getEmbeddedImages = message.querySelectorAll("img");
    if (getEmbeddedImages) {
        for (var i = 0, len = getEmbeddedImages.length; i < len; i++) {
            getEmbeddedImages[i].onload = function(e) {
                setTimeout(function() {
                    if (e.target.offsetHeight > (window.innerHeight - 150)) {
                        e.target.style.height = (window.innerHeight - 150);
                    }
                }, 1000);
            }
        }
    }
    updateNicknameAssociatedWithNewMessage(message);
};

Textual.nicknameSingleClicked = function(e) {
    userNicknameSingleClickEvent(e);
}


function updateNicknameAssociatedWithNewMessage(e) {
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
	/* e is nested as the .sender so we have to go three parents
	 up in order to reach the parent div that owns it. */
	var parentSelector = e.parentNode.parentNode.parentNode.parentNode;

	parentSelector.classList.toggle("selectedUser");
}

function userNicknameSingleClickEvent(e) {
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
