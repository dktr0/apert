var ac; // audio context

function baseOnLoad() {
  ac = new (window.AudioContext||window.webkitAudioContext)();
  test();
}

function test() {
  sine = ac.createOscillator();
  sine.type = 'square';
  sine.frequency.value = 440;
  sine.start();
  filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  filter.gain.value = 0;
  sine.connect(filter);
  gainNode = ac.createGain();
  filter.connect(gainNode);
  gainNode.connect(ac.destination);
}
