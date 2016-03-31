process.title = 'apert';
var stderr = process.stderr;

// dependencies
var http = require('http');
var url = require('url');
var WebSocket = require('ws');
var express = require('express');
var nopt = require('nopt');
var osc = require('osc');
var fs = require('fs');

var apertRefreshCount = 0;

// parse command-line options
var knownOpts = {
    "password" : [String, null],
    "javascript" : [String, null],
    "tcp-port" : [Number, null],
    "osc-port" : [Number, null],
    "help": Boolean
};

var shortHands = {
    "p" : ["--password"],
    "t" : ["--tcp-port"],
    "o" : ["--osc-port"],
    "l" : ["--load"]
};

var parsed = nopt(knownOpts,shortHands,process.argv,2);

if(parsed['help']!=null) {
    stderr.write("usage:\n");
    stderr.write(" --help (-h)               this help message\n");
    stderr.write(" --password [word] (-p)    password to authenticate OSC messages to server (required)\n");
    stderr.write(" --osc-port (-o) [number]  UDP port on which to receive OSC messages (default: 8080)\n");
    stderr.write(" --tcp-port (-t) [number]  TCP port for plain HTTP and WebSocket connections (default: 8080)\n");
    stderr.write(" --load (-l) [path]        path to piece-specific javascript file to load as specific.js\n");
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

var javascript = parsed['javascript'];
var specific;
if(javascript!=null) {
  fs.readFile(javascript,'utf8', function (err,data) {
    if (err) {
      console.log(err);
      return;
    }
    specific = data;
    console.log("specific javascript loaded from " + javascript);
  });
}

// create HTTP (Express) server
var server = http.createServer();
var app = express();
app.use(express.static(__dirname));
app.get('/_apert_/specific.js',function(req,res,next) {
  if(specific!=null) {
    res.send(specific);
  }
  res.end();
});
app.get('/?', function(req, res, next) {
  res.send('<html><head><script src="base.js"></script><script src="specific.js"></script></head><body onload="baseOnLoad()"></body></html>');
  res.end();
});
server.on('request',app);

var store = [];

// create WebSocket server
var wss = new WebSocket.Server({server: server});
wss.broadcast = function(data) {
  for (var i in this.clients) this.clients[i].send(data);
};
wss.on('connection',function(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log("new WebSocket connection: " + location);
  ws.on('message',function(m) {
      var n = JSON.parse(m);
      if(n.password != password) {
        console.log("invalid password")
      }
      else if(n.request == null) {
        console.log("request field is missing")
      }
      else {
        if(n.request == "all") {
          all(n.name,n.args);
        }
        if(n.request == "load") {
          load(n.path);
        }
        if(n.request == "refresh") {
          refresh();
        }
      }
  });
});

// make it go
server.listen(tcpPort, function () { console.log('Listening on ' + server.address().port) });

// send refresh count every 3 seconds
function sendRefreshCount() {
  var json = {type:'refreshCount',count:apertRefreshCount};
  var s = JSON.stringify(json);
  wss.broadcast(s);
}
setInterval(function() {
  sendRefreshCount();
},3000);

// create OSC server (listens on UDP port, resends OSC messages to browsers)
var udp = new osc.UDPPort( { localAddress: "0.0.0.0", localPort: oscPort });
if(udp!=null)udp.open();
udp.on('message', function(m) {
  if(m.address == "/all") {
    var name = m.args[0];
    var args = m.args.splice(0,1);
    all(name,args);
    console.log("/all");
  }
  if(m.address == "/load") {
    load(m.args[0]);
    console.log("/load " + m.args[0]);
  }
  if(m.address == "/refresh") {
    refresh();
    console.log("/refresh");
  }
});

// execute the function 'name' with arguments 'args' on all connected devices
function all(name,args) {
  var n = { 'type': 'all', 'name': name, 'args': args };
  try { wss.broadcast(JSON.stringify(n)); }
  catch(e) { stderr.write("warning: exception in WebSocket send\n"); }
}

function load(path) {
  fs.readFile(path,'utf8', function (err,data) {
    if (err) {
      console.log("unable to load specific javascript at " + path + ": " + err);
      return;
    }
    specific = data;
    console.log("specific javascript loaded from " + javascript);
  });
}

function refresh() {
  apertRefreshCount = apertRefreshCount + 1;
  sendRefreshCount();
}
