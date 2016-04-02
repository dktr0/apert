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
    "load" : [String, null],
    "folder" : [String, null],
    "tcp-port" : [Number, null],
    "osc-port" : [Number, null],
    "jquery" : [String, null],
    "help": Boolean
};

var shortHands = {
    "p" : ["--password"],
    "t" : ["--tcp-port"],
    "o" : ["--osc-port"],
    "f" : ["--folder"],
    "l" : ["--load"],
    "j" : ["--jquery"]
};

var parsed = nopt(knownOpts,shortHands,process.argv,2);

if(parsed['help']!=null) {
    stderr.write("usage:\n");
    stderr.write(" --help (-h)               this help message\n");
    stderr.write(" --password [word] (-p)    password to authenticate OSC messages to server (required)\n");
    stderr.write(" --tcp-port (-t) [number]  TCP port for plain HTTP and WebSocket connections (default: 8000)\n");
    stderr.write(" --osc-port (-o) [number]  UDP port on which to receive OSC messages (default: none)\n");
    stderr.write(" --folder (-f) [path]      path to folder from which to serve additional files\n");
    stderr.write(" --load (-l) [path]        path (appended to folder path) to specific JavaScript added to page\n");
    stderr.write(" --jquery (-j) [path]      path to local jQuery file which will be served\n");
    process.exit(1);
}

var password = parsed['password'];
if(password == null) {
    stderr.write("Error: --password option is not optional!\n");
    stderr.write("use --help to display available options\n");
    process.exit(1);
}
var tcpPort = parsed['tcp-port'];
if(tcpPort==null) tcpPort = 8000;
var oscPort = parsed['osc-port'];

var folder = parsed['folder'];
if(folder == null) folder = __dirname;
var javascript = parsed['load'];
var specific;
loadJavascript();

var jqueryPath = parsed['jquery'];
var jquery;
if(jqueryPath!=null) {
  fs.readFile(jqueryPath,'utf8', function (err,data) {
    if (err) {
      console.log("*** PROBLEM: unable to load " + jqueryPath + ": " + err);
      return;
    }
    jquery = data;
    updateHtml();
  });
}

// create HTTP (Express) server
var server = http.createServer();
var app = express();
loadBase();
app.get('/', function(req, res, next) {
  if(html != null) res.send(html);
  res.end();
});
app.get('/control', function(req,res,next) {
  if(controlHtml != null) res.send(controlHtml);
  res.end();
});
app.get('/jquery', function(req,res,next) {
  if(jquery != null) res.send(jquery);
  res.end();
});
app.use(express.static(folder));
server.on('request',app);

// create WebSocket server
var wss = new WebSocket.Server({server: server});
wss.broadcast = function(data) {
  for (var i in this.clients) {
    try {
      this.clients[i].send(data);
    }
    catch(e) {
      console.log("warning: exception in ")
    }
  }
};
wss.on('connection',function(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log("new WebSocket connection: " + location);
  sendClientCount();
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
        if(n.request == "folder") {
          folder(n.path);
        }
      }
  });
});

// make it go
server.listen(tcpPort, function () { console.log('Listening on ' + server.address().port) });

// send refresh count every 2.9 seconds
function sendRefreshCount() {
  var json = {type:'refreshCount',count:apertRefreshCount};
  var s = JSON.stringify(json);
  wss.broadcast(s);
}
setInterval(function() {
  sendRefreshCount();
},2900);

// send connected clients count every 5.3 seconds
function sendClientCount() {
  var json = {type:'clientCount',count:wss.clients.length};
  var s = JSON.stringify(json);
  wss.broadcast(s);
}
setInterval(function() {
  sendClientCount();
},5300);

// create OSC server (listens on UDP port, resends OSC messages to browsers)
if(oscPort != null) {
  var udp = new osc.UDPPort( { localAddress: "0.0.0.0", localPort: oscPort });
  if(udp!=null)udp.open();
  udp.on('message', function(m) {
    if(m.args.length == 0) {
      console.log("error: received OSC with no arguments (all messages require password at least...)");
      return;
    }
    if(m.args[0] != password) {
      console.log("error: received OSC with incorrect password");
      return;
    }
    m.args.splice(0,1); // remove password argument once it has matched
    if(m.address == "/all") {
      var name = m.args[0];
      m.args.splice(0,1);
      all(name,m.args);
      console.log("/all " + name + " " + m.args);
    }
    if(m.address == "/load") {
      load(m.args[0]);
      console.log("/load " + m.args[0]);
    }
    if(m.address == "/refresh") {
      refresh();
      console.log("/refresh");
    }
    if(m.address == "/folder") {
      setFolder(m.args[0]);
      console.log("/folder " + m.args[0]);
    }
  });
}

var base;

function loadBase() {
  fs.readFile('base.js','utf8', function (err,data) {
    if (err) {
      console.log("*** PROBLEM: unable to load base.js: " + err);
      return;
    }
    base = data;
    updateHtml();
  });
  fs.readFile('control.html','utf8', function (err,data) {
    if (err) {
      console.log("*** PROBLEM: unable to load control.html: " + err);
      return;
    }
    controlHtml = data;
  });
}

function updateHtml() {
  var work = '<html><head>'
  if(jquery != null) work = work + '<script src="jquery"></script>';
  if(base != null) {
    work = work + '<script>';
    work = work + base;
    work = work+ '</script>';
  }
  if(specific != null) {
    work = work + '<script>';
    work = work + specific;
    work = work + '</script>';
  }
  work = work + '</head><body onload="baseOnLoad()"></body></html>';
  html = work;
}

// execute the function 'name' with arguments 'args' on all connected devices
function all(name,args) {
  var n = { 'type': 'all', 'name': name, 'args': args };
  try { wss.broadcast(JSON.stringify(n)); }
  catch(e) { stderr.write("warning: exception in WebSocket send\n"); }
}

function load(path) {
  javascript = path;
  loadJavascript();
}

function setFolder(path) {
  folder = path;
  loadJavascript();
}

function loadJavascript() {
  if(javascript == null) return;
  var fullPath = folder + "/" + javascript;
  fs.readFile(fullPath,'utf8', function (err,data) {
    if (err) {
      console.log("unable to load specific javascript at " + fullPath + ": " + err);
      return;
    }
    specific = data;
    updateHtml();
    console.log("specific javascript loaded from " + fullPath);
  });
}

function refresh() {
  apertRefreshCount = apertRefreshCount + 1;
  sendRefreshCount();
}
