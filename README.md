# The Big Picture

apert lets you provide JavaScript functions and other files (for example, sound files) to a network of web browsers (for example, on audience members' mobile devices) and then call those functions through a centralized server interface. In slightly more detail:

1. You write a JavaScript file that defines some functions to respond to messages. For example, you might define functions that use the Web Audio API to start a particular type of synthesized sound. The file default.js in the apert folder is an example of such a file (and is also used by default when no alternative is provided - it is useful for testing).

2. You launch the apert server (apert.js) somewhere and point it to your JavaScript. As noted above, if you don't point it to your own JavaScript file, it uses default.js, which is useful for testing devices and networks, etc.

3. From any number of web browsers, surf to the address of your apert server. If you are running the apert server on your own machine and testing on your own machine, you could use the address 127.0.0.1:8000 in your web browser. If you are running the server on one machine and testing from other machines, you'll need to figure out what the address of the "server machine" on the network is.

4. Issue messages that get sent to all the web browsers. The top paragraph of the section Protocol (below) explains three ways to do this. A simple test without providing any of your own code is to use the built-in control interface to turn a test tone on and off, and use the "all" button to trigger the example synth function called 'simple' in default.js: you'd enter 'simple' in the leftmost field of the 'all' interface, a frequency in Hertz in the next field of the 'all' interface, and an amplitude in absolute values (i.e. 1.0 is the maximum) in the next field. This will cause the 'simple' function to be called with those arguments on all web browsers connected to the apert page.

You can test apert "out of the box" using the synths/functions defined in default.js and the control interface. Then you can make more original and fancy things by (a) writing your own JavaScript files to provide and (b) issuing messages (through the server to the browsers) in your own way (for example, from another programming environment or application that you create, using either OSC over UDP or JSON over WebSockets).

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

## Point apert towards a separate folder from which files can be served

OSC: /folder [password] [path]
JSON: { request: "folder", password: "???", path: "???" }
where path is a path to a folder from which additional files can be served to client
web browsers. The password needs to match or the message will be ignored.

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

OSC: /refresh [password]
JSON: { request: "refresh", password: "???" }
all web browsers connected to the apert server will, shortly, reload the current
web document. This might be used after /load (above), for example, in order to force all
of the browsers to use a newly loaded JavaScript file.
