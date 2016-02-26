var ac; // audio context

function baseOnLoad() {
  setupAudioContext();
  setupWebSocket();
}

function setupAudioContext() {
  ac = new (window.AudioContext||window.webkitAudioContext)();
}

function setupWebSocket() {
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  var url = 'ws://' + location.hostname + ':8080';
  console.log("attempting websocket connection to " + url);
  ws = new WebSocket(url);
  ws.onopen = function () {
    console.log("extramuros websocket connection opened");
  };
  ws.onerror = function () {
    console.log("ERROR opening extramuros websocket connection");
  };
  ws.onmessage = function (m) {
    var data = JSON.parse(m.data);
    if(data.type == 'osc') {
      console.log("received " + data.address);
      eval( data.address.substring(1) + "(data.args)");
      // should probably check to make sure the function exists first!...
    } else {
      console.log("received WebSocket message of unknown type");
    }
  }
}

function testOn() {
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
  if(ac.test != null) {
    ac.test.gain.disconnect(ac.destination);
    ac.test = null;
  }
}
