var FADE_TIME = 250; // ms

// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// list - the list to append/prepend to
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
function addElement (el, list, window, options) {
  var $el = $(el);

  // Setup default options
  if (!options) {
    options = {};
  }
  if (typeof options.fade === 'undefined') {
    options.fade = true;
  }
  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }

  // Apply options
  if (options.fade) {
    $el.hide().fadeIn(FADE_TIME);
  }
  if (options.prepend) {
    list.prepend($el);
  } else {
    list.append($el);
  }

  if (options.scrollToBottom === true) {
    window.scrollTop(list[0].scrollHeight);
  }
}

function getTime() {
  var date = new Date()
  var month = new Array();
  month[0] = 'Jan';
  month[1] = 'Feb';
  month[2] = 'Mar';
  month[3] = 'Apr';
  month[4] = 'May';
  month[5] = 'Jun';
  month[6] = 'Jul';
  month[7] = 'Aug';
  month[8] = 'Sep';
  month[9] = 'Oct';
  month[10] = 'Nov';
  month[11] = 'Dec';
  return '[' + month[date.getMonth()] + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '] '
}

function replaceNewLines (input) {
  var replacedString = input.replace(/\n/ig, '<br>')
  return replacedString
}

// Prevents input from having injected markup
function cleanInput (input) {
  var strippedString = input.replace(/(<([^>]+)>)/ig, '').replace(/^([\r\n]+)/ig, '');
  return strippedString;
}

function getBaseUrl() {
  var getUrl = window.location
  return getUrl.protocol + '//' + getUrl.host + '/'
}


function scrollTitle(text, cancellationToken) {
  document.title = text;
  setTimeout(function () {
    if (!cancellationToken.isCanceled)
    {
      scrollTitle(text.substr(3) + text.substr(0, 3));
    }
  }, 500);
}

function logError(error) {
  console.log('error:' + error)
}

function logSuccess(msg) {
  console.log('success:' + msg)
}

var setOneWay = function(sdp) {
  var sdpLines = sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    sdpLines[i] = sdpLines[i].replace(/^a=sendrecv/i, 'a=sendonly')
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
};

var setTwoWay = function(sdp) {
  var sdpLines = sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    sdpLines[i] = sdpLines[i].replace(/^a=recvonly/i, 'a=sendrecv')
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
};

var preferOpus = function(sdp) {
  var sdpLines = sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      var mLineIndex = i;
      break;
    }
  }

  if (typeof mLineIndex !== 'undefined') {
    for (i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {
        var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
        if (opusPayload) {
          sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
        }
        break;
      }
    }

    sdpLines = removeCN(sdpLines, mLineIndex);
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
};

var extractSdp = function(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return (result && result.length == 2)? result[1]: null;
};

var setDefaultCodec = function(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = new Array();
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) newLine[index++] = payload;
    if (elements[i] !== payload) newLine[index++] = elements[i];
  }
  return newLine.join(' ');
};

var removeCN = function(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) mLineElements.splice(cnPos, 1);
      sdpLines.splice(i, 1);
    }
  }
  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
};
