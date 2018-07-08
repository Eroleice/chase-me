const express = require('express');
const app = express();
const serv = require('http').Server(app);
const vector2 = require('victor'); // http://victorjs.org/
const gameloop = require('node-gameloop'); // https://www.npmjs.com/package/node-gameloop
const http = require('http');
const iconv = require("iconv-lite");

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

class gay {

    constructor() {
        this.background = [];
        this.entities = {
            'player': {},
            'npc': {}
        }
        this.border = 2000;
    }

    report() {
        var rep = {
            'player': {},
            'npc': {}
        }
        for (var k in this.entities.player) {
            rep.player[k] = {
                'qq': this.entities.player[k].qq,
                'x': this.entities.player[k].coordinate.x,
                'y': this.entities.player[k].coordinate.y,
                'radius': this.entities.player[k].radius
            };
        }
        rep.npc = this.entities.npc;
        return rep;
    }

    addPlayer(id, data) {
        this.entities.player[id] = data;
    }

    removePlayer(id) {
        delete this.entities.player[id];
    }

    getName(id, qq) {
        var url = 'http://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?get_nick=1&uins=' + qq;
        http.get(url, function (res) {
            var chunks = [];
            res.on('data', function (chunk) {
                chunks.push(chunk);
            });
            res.on('end', function () {
                var str = iconv.decode(Buffer.concat(chunks), 'GBK');
                var name = str.substring(
                    str.lastIndexOf(',"') + 2,
                    str.lastIndexOf('",0]}')
                );
                game.entities.player[id].name = name;
            });
        });
    }


    skillPress(id, data) {
        if (data.skill == 'speedUp') {
            this.entities.player[id].maxSpeed = (data.state) ? 15 : 5;
        }
    }

    update() {
        for (var i in this.entities.player) {
           
        }
    }
}

var game = new gay();

var SOCKET_LIST = {};

const io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {

    socket.id = Math.random();
    console.log(socket.id + ' connected.');
    SOCKET_LIST[socket.id] = socket;

    socket.on('newPlayer', function (qq) {
        var pos = [Math.floor(Math.random() * 640), Math.floor(Math.random() * 360)];
        var data = {
            'qq': qq,
            'name': '',
            'coordinate': new vector2.fromArray(pos),
            'speed': new vector2(0, 0),
            'target': new vector2.fromArray(pos),
            'maxSpeed': 10,
            'maxAcceleration': 5,
            'radius': 40,
            'buff': [],
            'lastHit': ''
        }
        game.addPlayer(socket.id, data);
        game.getName(socket.id, qq);
        console.log(socket.id + ' entered game!');
    });

    socket.on('disconnect', function () {
        console.log(socket.id + ' disconnected.');
        delete SOCKET_LIST[socket.id];
        game.removePlayer(socket.id);
    });
});

const loop = gameloop.setGameLoop(function (delta) {

    game.update();

    var entities = game.report();

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('update', {
            'id': socket.id,
            'entities': entities
        });
    }

}, 1000 / 60);

// gameloop.clearGameLoop(loop);