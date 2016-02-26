process.title = 'apert';
var stderr = process.stderr;

// dependencies
var http = require('http');
var url = require('url');
var WebSocket = require('ws');
var express = require('express');
var nopt = require('nopt');
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
    stderr.write(" --osc-port (-o) [number]  UDP port on which to receive OSC messages (default: 8080)\n");
    stderr.write(" --tcp-port (-t) [number]  TCP port for plain HTTP and WebSocket connections (default: 8080)\n");
    process.exit(1);
}

var password = parsed['password'];
if(password == null) {
    stderr.write("Error: --password option is not optional!\n");
    stderr.write("use --help to display available options\n");
    process.exit(1);
}

var oscPort = parsed['osc-port'];
if(oscPort==null) oscPort = 8080;
var tcpPort = parsed['tcp-port'];
if(tcpPort==null) tcpPort = 8080;

// create HTTP (Express) server
var server = http.createServer();
var app = express();
app.use(express.static(__dirname));
app.get('/?', function(req, res, next) {
  res.writeHead(302, {location: '/index.html'});
  res.end();
});
server.on('request',app);

// create WebSocket server
var wss = new WebSocket.Server({server: server});
wss.broadcast = function(data) {
  for (var i in this.clients) this.clients[i].send(data);
};
wss.on('connection',function(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log("new WebSocket connection: " + location);
});

// make it go
server.listen(tcpPort, function () { console.log('Listening on ' + server.address().port) });

// create OSC server (listens on UDP port, resends OSC messages to browsers)
var udp = new osc.UDPPort( { localAddress: "0.0.0.0", localPort: oscPort });
if(udp!=null)udp.open();
udp.on('message', function(m) {
  var n = { 'type': 'osc', 'address': m.address, 'args': m.args };
  try { wss.broadcast(JSON.stringify(n)); }
  catch(e) { stderr.write("warning: exception in WebSocket send\n"); }
});
