// simple SuperCollider test for apert

u = NetAddr("127.0.0.1",8000);
u.sendMsg("/all","password","testOn"); // turn on test tone on all connected browsers
u.sendMsg("/all","password","testOff"); // turn off test tone on all connected browsers
u.sendMsg("/all","password","simple",440,0.5); // trigger a simple tone, f=440 Hz, amp=0.5
u.sendMsg("/folder","password","/Users/someFolder"); // set folder from which additional files are served
u.sendMsg("/load","password","aJavaScriptFile.js"); // make this JavaScript file be loaded in future page loads
u.sendMsg("/refresh","password"); // force all client browsers to reload page
// above line might be used after /load and/or /folder in order to switch to a new configuration
