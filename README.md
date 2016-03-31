
# Protocol

The apert server will receive and respond to the following messages. There are three main ways that these
messages might be delivered to apert server:

1. via Open Sound Control (OSC) messages sent over UDP to the apert server's UDP port
2. as JSON objects delivered to the server over its WebSocket connection
3. using the web control interface provided by the apert server as control.html (for
  example by pointing a browser to http://127.0.0.1:8080/control.html if apert is running
  on the local computer (127.0.0.1) using TCP port 8080) - this is just an extra
  interface on top of method 2 (above).

## Call a function in all connected web browsers

OSC: /all [password] [name] [arg1] [arg2] [arg3]... [arg-n]  
JSON: { request: "all", password: "???", name: "???", args:[arg1,arg2,arg3...arg-n] }
where the name field provides the name of a JavaScript function to be called in all
web browsers connected to the apert server. The password needs to match or the message
will be ignored.

## Load a specific JavaScript file that can be provided to all web browsers

OSC: /load [password] [path]
JSON: { request: "load", password: "???", path: "???"}
where the path field provides a valid path to a JavaScript file (local to the apert server)
that will be read and provided to all web browsers connected to the apert server
whenever the page is loaded/refreshed. Note: this does not trigger a page reload within
the connected web browsers - it just changes the specific JavaScript file that is provided
to the browsers when they do load the page (alongside the base.js file). To force a page
reload in the browsers, use /refresh (below). The password needs to match or the message
will be ignored.

## Refresh the web page displayed by all web browsers

OSC: /refresh
JSON: { request: "refresh", password: "???" }
all web browsers connected to the apert server will, shortly, reload the current
web document. This might be used after /load (above), for example, in order to force all
of the browsers to use a newly loaded JavaScript file.
