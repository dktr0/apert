process.title = 'cool new mobile platform';
var stderr = process.stderr;

// dependencies
var express = require('express');
var nopt = require('nopt');
var WebSocket = require('ws');
var osc = require('osc');

// parse command-line options
var knownOpts = {
    "password" : [String, null],
    "tcp-port" : [Number, null],
    "osc-port" : [Number, null],
    "help": Boolean
};

var shortHands = {
    "p" : ["--password"],
    "t" : ["--tcp-port"],
    "o" : ["--osc-port"]
};

var parsed = nopt(knownOpts,shortHands,process.argv,2);

if(parsed['help']!=null) {
    stderr.write("usage:\n");
    stderr.write(" --help (-h)               this help message\n");
    stderr.write(" --password [word] (-p)    password to authenticate OSC messages to server (required)\n");
    stderr.write(" --osc-port (-o) [number]  UDP port on which to receive OSC messages (required)\n");
    stderr.write(" --tcp-port (-t) [number]  TCP port for plain HTTP and WebSocket connections (default: 80)\n");
    process.exit(1);
}

if(process.argv.length<3) {
    stderr.write("use --help to display available options\n");
}

var tcpPort = parsed['tcp-port'];
if(tcpPort==null) tcpPort = 80;
console.log(tcpPort.toString());

var oscPort = parsed['osc-port'];
if(oscPort==null) {
  stderr.write("Error: --osc-port option is not optional!\n");
  process.exit(1);
}
var password = parsed['password'];
if(password == null) {
    stderr.write("Error: --password option is not optional!\n");
    process.exit(1);
}

// create HTTP server
var server = express();
server.use(express.static(__dirname));
server.get('/?', function(req, res, next) {
  res.writeHead(302, {location: '/index.html'});
  res.end();
});
server.listen(tcpPort);

// create WebSocket server
var wss = new WebSocket.Server({port: tcpPort});
wss.broadcast = function(data) {
  for (var i in this.clients)
    this.clients[i].send(data);
};

// create OSC server (listens on UDP port for incoming OSC messages)
var udp = new osc.UDPPort( { localAddress: "0.0.0.0", localPort: oscPort });
if(udp!=null)udp.open();

// route incoming OSC messages back to web clients over WebSocket
wss.on('connection',function(ws) {
    // route incoming OSC back to browsers
    var udpListener = function(m) {
      var n = { 'type': 'osc', 'address': m.address, 'args': m.args };
      try { ws.send(JSON.stringify(n)); }
      catch(e) { stderr.write("warning: exception in WebSocket send\n"); }
    };
    if(udp!=null) udp.addListener("message",udpListener);
    ws.on("close",function(code,msg) {
	     if(udp!=null)udp.removeListener("message",udpListener);
    });
});
