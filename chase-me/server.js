const express = require('express');
const app = express();
const serv = require('http').Server(app);

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
            if (this.entities.player[k].qq !== 10000) {
                rep.player[k] = this.entities.player[k];
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

    updateKeyPress(id, data) {
        this.entities.player[id].directionPress[data.inputId] = data.state;
    }

    skillPress(id, data) {
        if (data.skill == 'speedUp') {
            // ????
            this.entities.player[id].maxSpeed = (data.state) ? 15 : 5;
        }
    }

    update() {
        for (var i in this.entities.player) {
            // x?
            if (this.entities.player[i].directionPress.right) {
                this.entities.player[i].direction.x += 2 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].directionPress.left) {
                this.entities.player[i].direction.x -= 2 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].direction.x > this.entities.player[i].maxSpeed) {
                this.entities.player[i].direction.x -= 4 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].direction.x < -1 * this.entities.player[i].maxSpeed) {
                this.entities.player[i].direction.x += 4 * this.entities.player[i].acceleration;
            }
            // y?
            if (this.entities.player[i].directionPress.down) {
                this.entities.player[i].direction.y += 2 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].directionPress.up) {
                this.entities.player[i].direction.y -= 2 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].direction.y > this.entities.player[i].maxSpeed) {
                this.entities.player[i].direction.y -= 4 * this.entities.player[i].acceleration;
            }
            if (this.entities.player[i].direction.y < -1 * this.entities.player[i].maxSpeed) {
                this.entities.player[i].direction.y += 4 * this.entities.player[i].acceleration;
            }
            // ????1
            this.entities.player[i].x += this.entities.player[i].direction.x;
            this.entities.player[i].y += this.entities.player[i].direction.y;
        }
    }

    updateAvatar(id, qq) {
        this.entities.player[id].qq = qq;
    }
}

var game = new gay();

var SOCKET_LIST = {};

const io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    var data = {
        'qq': 10000,
        'x': Math.floor(Math.random() * 1280 + 1),
        'y': Math.floor(Math.random() * 720 + 1),
        'direction': {
            'x': 0,
            'y': 0
        },
        'directionPress': {
            'right': false,
            'up': false,
            'left': false,
            'down': false
        },
        'maxSpeed': 5,
        'speed': 0,
        'acceleration': 0.2,
        'radius': 40
    }
    game.addPlayer(socket.id, data);
    console.log(socket.id + ' connected.');
    SOCKET_LIST[socket.id] = socket;

    socket.on('avatar', function (data) {
        game.updateAvatar(socket.id,data);
    });

    socket.on('keyPress', function (data) {
        game.updateKeyPress(socket.id, data);
    });

    socket.on('skillPress', function (data) {
        game.skillPress(socket.id, data);
    });

    socket.on('disconnect', function () {
        console.log(socket.id + ' disconnected.');
        delete SOCKET_LIST[socket.id];
        game.removePlayer(socket.id);
    });
});

var r = setInterval(function () {

    game.update();

    var entities = game.report();

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('update', {
            'id': socket.id,
            'entities': entities
        });
    }

}, 20);