// simple SuperCollider test for apert

u = NetAddr("127.0.0.1",8080);

u.sendMsg("/testOn");

u.sendMsg("/testOff");
