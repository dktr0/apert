var ac; // audio context
var apertRefreshCount;
var apertClientCount;
var apertStartAudioAlreadyCalled = false;

// within the apert framework, the function aperLog is called for all log
// messages. if you provide a function called apertLogExtra with a single
// argument it is also called when a log message is issued, with the text
// of the message as the argument:

function apertLog(x) {
  console.log("apert: " + x);
  if (typeof apertLogExtra == 'function') {
    apertLogExtra(x);
  }
}

function apertRequest(request,args) {
  // this is a convenience function used by other functions that make requests
  // to the apert server
  args.request = request;
  ws.send(JSON.stringify(args));
}

function apertMemorySet(key,value) {
  // call this in your code to set a key-value pair in a shared memory
  // entries are unique to each client/browser
  apertRequest('set',{key:key,value:value});
}

function apertGlobalRead(key) {
  // call this in your code to request an update on the value of a given
  // entry in a global dictionary of Strings
  // to catch the response, implement the hook function apertReceivedRead(key,value)
  apertRequest('read',{key:key});
}

// the function below is called automatically when the document in a client
// browser is loaded, and initializes WebSocket communication with the apert
// server:

function apertStartWebSocket() {
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  // *** port should not be hardwired in the line below!!!
  var url = 'ws://' + location.hostname + ':8000';
  apertLog("attempting websocket connection to " + url);
  ws = new WebSocket(url);
  ws.onopen = function () {
    apertLog("websocket connection opened");
    if (typeof apertWebSocketOpened == 'function') {
      apertLog('calling apertWebSocketOpened...');
      apertWebSocketOpened(); // call initializer function provided by specific loaded JavaScript
      apertLog('returned from apertWebSocketOpened');
    }else{
      apertLog('There was no apertWebSocketOpened function. You can make one if you like!');
    }
  };
  ws.onerror = function () {
    apertLog("ERROR in apert websocket connection");
  };
  ws.onclose = function () {
    apertLog('apert websocket closed - retrying in 5 seconds...');
    ws = null;
    setTimeout(apertStartWebSocket,5000);
  };
  ws.onmessage = function (m) {
    var data = JSON.parse(m.data);
    if(data.type == 'refreshCount') {
      // not logging refreshCount to avoid excessively busy logging
      // but you can check it by evaluating "apertRefreshCount" at a web console
      // console.log("refreshCount = " + data.count);
      if(apertRefreshCount != null) {
        if(data.count != apertRefreshCount) {
          window.location.reload(true); // page version has changed so force reload from server
        }
      }
      else apertRefreshCount = data.count;
    }
    else if(data.type == 'clientCount') {
      if(data.count != apertClientCount) {
        apertLog("client count is " + data.count);
        apertClientCount = data.count;
      }
    }
    else if(data.type == 'sendTo') {
      apertLog("/sendTo " + data.value);
      if (typeof apertReceivedSendTo == 'function') {
        apertReceivedSendTo(data.value);
      }
    }
    else if(data.type == 'read') {
      // implement the function apertReceivedRead in order to catch the response
      // to read requests issues with apertGlobalRead
      if (typeof apertReceivedRead == 'function') {
        apertReceivedRead(data.key,data.value);
      }
    }
    else if(data.type == 'all') {
      apertLog("/all " + data.name + " " + data.args);
      var name = data.name;
      if(data.args.length == 0) eval(name + "()");
      else if(data.args.length == 1) eval(name + "(data.args[0])");
      else if(data.args.length == 2) eval(name + "(data.args[0],data.args[1])");
      else if(data.args.length == 3) eval(name + "(data.args[0],data.args[1],data.args[2])");
      else if(data.args.length == 4) eval(name + "(data.args[0],data.args[1],data.args[2],data.args[3])");
      else if(data.args.length == 5) eval(name + "(data.args[0],data.args[1],data.args[2],data.args[3],data.args[4])");
      else if(data.args.length == 6) eval(name + "(data.args[0],data.args[1],data.args[2],data.args[3],data.args[4],data.args[5])");
      else apertLog("warning: too many arguments in all message, apert is unfinished software, so sorry, try again later");
      // should probably check to make sure the function exists first, also!...
    }
    else {
      apertLog("received WebSocket message of unknown type");
    }
  }
}

// the function below should be called by artist provided code in order
// order to create (once) a valid audio context. For things to work on iOS,
// this function needs to be called from a user interaction event:

function apertStartAudio() {
  if(apertStartAudioAlreadyCalled)return;
  apertStartAudioAlreadyCalled=true;
  try {
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    ac = new AudioContext();
    apertLog("created new audio context");
  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
  if (typeof apertInitialize == 'function') {
    apertLog('calling apertInitialize...');
    apertInitialize(); // call initializer function provided by specific loaded JavaScript
    apertLog('returned from apertInitialize');
  }else{
    apertLog('There was no apertInitialize function. You can make one if you like!');
  }
  apertSilentNote(); // create a silent synth to unmute audio on iOS
  // ac = new (window.AudioContext||window.webkitAudioContext)();
}

// a silent note, to be triggered by touch event calling apertStartAudio to unmute iOS audio
function apertSilentNote() {
	var sine = ac.createOscillator();
	sine.type = 'sine';
	sine.frequency.value = 440;
	var gain = ac.createGain();
	sine.connect(gain);
	gain.connect(ac.destination);
	sine.start();
	var now = ac.currentTime;
	gain.gain.setValueAtTime(0,ac.currentTime);
}

function testOn() {
  apertStartAudio();
  if(ac.test == null) {
    ac.test = {};
    ac.test.sine = ac.createOscillator();
    ac.test.sine.type = 'square';
    ac.test.sine.frequency.value = 440;
    ac.test.sine.start();
    ac.test.filter = ac.createBiquadFilter();
    ac.test.filter.type = 'lowpass';
    ac.test.filter.frequency.value = 1000;
    ac.test.filter.gain.value = 0;
    ac.test.sine.connect(ac.test.filter);
    ac.test.gain = ac.createGain();
    ac.test.filter.connect(ac.test.gain);
    ac.test.gain.connect(ac.destination);
  }
}

function testOff() {
  apertStartAudio();
  if(ac.test != null) {
    ac.test.gain.disconnect(ac.destination);
    ac.test = null;
  }
}
