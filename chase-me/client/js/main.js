class canvas {

    constructor() {
        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");
        this.entities = {
            'player': {},
            'npc': {}
        }
        this.effect = [];
    }

    update(entities) {

        // 根据socket数据更新this.entities
        for (var k in entities.player) {
            if (entities.player.qq !== 10000 && !this.entities.player[k]) {
                this.createPlayer(k, entities.player[k]);
            }
        }
        for (var k in this.entities.player) {
            if (!entities.player[k]) {
                delete this.entities.player[k];
            } else {
                this.entities.player[k].x = entities.player[k].x;
                this.entities.player[k].y = entities.player[k].y;
                this.entities.player[k].radius = entities.player[k].radius;
            }
        }

        // 重置画布
        this.drawBlock({ 'x': 0, 'y': 0, 'w': 1280, 'h': 720, 'color': 'white' });

        // 根据this.entities画图
        for (var k in this.entities.player) {
            if (this.entities.player[k].img !== null) {
                this.drawPlayer(this.entities.player[k]);
            }
        }
    }

    distanceCheck(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    drawBlock(arr) {
        this.ctx.fillStyle = arr.color;
        this.ctx.fillRect(arr.x, arr.y, arr.w, arr.h);
    }

    drawLine(arr) {
        this.ctx.moveTo(arr.x1, arr.y1);
        this.ctx.lineTo(arr.x2, arr.y2);
        this.ctx.stroke();
    }

    drawCircle(arr) {
        this.ctx.beginPath();
        this.ctx.arc(arr.x, arr.y, arr.r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    drawPic(arr) {
        this.ctx.drawImage(arr.img, arr.x, arr.y);
    }

    drawPlayer(arr) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(arr.x, arr.y, arr.radius, 0, Math.PI * 2, true);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(arr.img, arr.x - arr.radius, arr.y - arr.radius, arr.radius * 2, arr.radius * 2);
        this.ctx.restore();
    }

    createPlayer(id,arr) {
        this.entities.player[id] = {
            'x': arr.x,
            'y': arr.y,
            'radius': arr.radius,
            'img': null
        };
        var url = 'http://q1.qlogo.cn/g?b=qq&nk=' + arr.qq + '&s=100&t=1';
        var img = new Image();
        img.src = url;
        img.onload = function () {
            cv.updateImg(id,img);
        };
    }

    updateImg(id, img) {
        this.entities.player[id].img = img;
    }

}

var cv = new canvas();

var socket = io();

socket.on('update', function (data) {
    var self = data.id;
    var entities = data.entities;
    cv.update(entities);
});

function inputQQ() {
    var qq = parseInt(prompt('请输入您的QQ：'));
    if (qq > 10000 && qq < 99999999999) {
        socket.emit('avatar', qq);
    } else {
        inputQQ();
    }
}

inputQQ();

document.onkeydown = function (event) {
    if (event.keyCode === 39) {
        socket.emit('keyPress', {'inputId':'right','state':true});
    } else if (event.keyCode === 40) {
        socket.emit('keyPress', { 'inputId': 'down', 'state': true });
    } else if (event.keyCode === 37) {
        socket.emit('keyPress', { 'inputId': 'left', 'state': true });
    } else if (event.keyCode === 38) {
        socket.emit('keyPress', { 'inputId': 'up', 'state': true });
    } else if (event.keyCode === 32) {
        socket.emit('skillPress', { 'skill': 'speedUp', 'state': true });
    } 
}
document.onkeyup = function (event) {
    if (event.keyCode === 39) {
        socket.emit('keyPress', { 'inputId': 'right', 'state': false });
    } else if (event.keyCode === 40) {
        socket.emit('keyPress', { 'inputId': 'down', 'state': false });
    } else if (event.keyCode === 37) {
        socket.emit('keyPress', { 'inputId': 'left', 'state': false });
    } else if (event.keyCode === 38) {
        socket.emit('keyPress', { 'inputId': 'up', 'state': false });
    } else if (event.keyCode === 32) {
        socket.emit('skillPress', { 'skill': 'speedUp', 'state': false });
    } 
}