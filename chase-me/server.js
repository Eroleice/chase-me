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

serv.listen(80);

class gay {

    constructor() {
        this.stage = {
            'radius': 1000,
            'radiusK': 1
        };
        this.entities = {
            'player': {},
            'npc': {}
        };
        this.border = 2000;
    }

    update() {
        for (var i in this.entities.player) {
            // 根据鼠标位置移动
            var move = new vector2(0, 0);
            var force = new vector2(0, 0);
            if (this.entities.player[i].coordinate.length() > this.stage.radius) {
                var dist = Math.floor((this.entities.player[i].coordinate.length() - this.stage.radius) / 100) + 1;
                force = this.entities.player[i].coordinate.clone().normalize().invert().multiply(new vector2(dist, dist));
            }
            move = this.entities.player[i].speed.add(this.entities.player[i].target.multiply(this.entities.player[i].maxAcceleration));
            if (move.length() > this.entities.player[i].maxSpeed.length()) {
                move = move.add(force);
                this.entities.player[i].coordinate = this.entities.player[i].coordinate.add(move.normalize().multiply(this.entities.player[i].maxSpeed));
            } else {
                move = move.add(force);
                this.entities.player[i].coordinate = this.entities.player[i].coordinate.add(move);
            }
        }
    }
    report() {
        var rep = {
            'player': {},
            'npc': {}
        }
        for (var k in this.entities.player) {
            if (this.entities.player[k].name !== '') {
                rep.player[k] = {
                    'qq': this.entities.player[k].qq,
                    'name': this.entities.player[k].name,
                    'x': this.entities.player[k].coordinate.x,
                    'y': this.entities.player[k].coordinate.y,
                    'radius': this.entities.player[k].radius
                };
            }
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
                console.log(name + '信息录入完成！');
                game.entities.player[id].name = name;
            });
        });
    }


    skillPress(id, data) {
        if (data.skill == 'speedUp') {
            this.entities.player[id].maxSpeed = (data.state) ? 15 : 5;
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
        var pos = [Math.floor(Math.random() * 1000 - 500), Math.floor(Math.random() * 1000 - 500)];
        var data = {
            'qq': qq,
            'name': '',
            'coordinate': new vector2.fromArray(pos),
            'speed': new vector2(0, 0),
            'target': new vector2(0, 0),
            'maxSpeed': new vector2(10, 10),
            'maxAcceleration': new vector2(5, 5),
            'radius': 50,
            'buff': [],
            'lastHit': ''
        }
        game.addPlayer(socket.id, data);
        game.getName(socket.id, qq);
        console.log(socket.id + ' has entered game!');
    });

    socket.on('move', function (data) {
        if (game.entities.player[socket.id]) {
            game.entities.player[socket.id].target.x = data.x;
            game.entities.player[socket.id].target.y = data.y;
            game.entities.player[socket.id].target.normalize();
        }
    });
    socket.on('disconnect', function () {
        console.log(socket.id + ' has disconnected.');
        delete SOCKET_LIST[socket.id];
        game.removePlayer(socket.id);
    });
});

const loop = gameloop.setGameLoop(function (delta) {

    game.update();

    var entities = game.report();

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        if (typeof game.entities.player[socket.id] !== 'undefined' && game.entities.player[socket.id].name !== '') {
            socket.emit('update', {
                'id': socket.id,
                'stage': {
                    'radius': Math.floor(game.stage.radius * game.stage.radiusK)
                },
                'entities': entities
            });
        }

    }

}, 1000 / 30);

// gameloop.clearGameLoop(loop);