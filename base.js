var ac; // audio context
var apertRefreshCount;
var apertStartAlreadyCalled = false;

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
  };
  ws.onerror = function () {
    apertLog("ERROR opening websocket connection");
  };
  ws.onmessage = function (m) {
    var data = JSON.parse(m.data);
    if(data.type == 'refreshCount') {
      // not logging refreshCount to avoid excessively busy logging
      // but you can check it by evaluating "apertRefreshCount" at a web console
      // console.log("refreshCount = " + data.count);
      if(apertRefreshCount != null) {
        if(data.count > apertRefreshCount) {
          window.location.reload(true); // page version has increased so force reload from server
        }
      }
      else apertRefreshCount = data.count;
    }
    else if(data.type == 'clientCount') {
      apertLog("client count is " + data.count);
    }
    else if(data.type == 'all') {
      apertLog("/all " + data.name + " " + data.args);
      var name = data.name;
      if(data.args.length == 0) eval(name + "()");
      else if(data.args.length == 1) eval(name + "(data.args[0])");
      else if(data.args.length == 2) eval(name + "(data.args[0],data.args[1])");
      else if(data.args.length == 3) eval(name + "(data.args[0],data.args[1],data.args[2])");
      else if(data.args.length == 4) eval(name + "(data.args[0],data.args[1],data.args[2],data.args[3])");
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
  apertLog("creating new Web audio context");;
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

document.addEventListener('touchend',function() {
  apertLog('about to call apertStartAudio from touch event');
  apertStartAudio();
},false);

function simple(freq,amp) {
  apertStartAudio();
	var sine = ac.createOscillator();
	sine.type = 'sine';
	sine.frequency.value = freq;
	var gain = ac.createGain();
	sine.connect(gain);
	gain.connect(ac.destination);
	sine.start();
	// envelope
	var now = ac.currentTime;
	gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(amp,now+0.005); gain.gain.linearRampToValueAtTime(0,now+0.405);
	// schedule cleanup
	setTimeout(function() {
		sine.stop();
		sine.disconnect(gain);
		gain.disconnect(ac.destination);
	},1000);
};
