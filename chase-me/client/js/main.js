var mc = false;
var mousePosition = { 'x': 0, 'y': 0 };

class canvas {

    constructor() {
        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");
        this.entities = {
            'player': {},
            'npc': {}
        }
        this.self = '';
        this.effect = [];
    }

    update(data) {

        // 获取canvas信息
        var stageWidth = this.c.width;
        var stageHeight = this.c.height;

        var stageMidX = stageWidth / 2;
        var stageMidY = stageHeight / 2;

        // 中心化
        var shiftX = stageMidX - data.entities.player[this.self].x;
        var shiftY = stageMidY - data.entities.player[this.self].y;

        // 重置画布
        this.drawBlock({ 'x': 0, 'y': 0, 'w': stageWidth, 'h': stageHeight, 'color': 'white' });

        // 绘制网格
        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'gray';

        var netX = Math.floor((stageMidX + shiftX) % 50) + 0.5;
        var netY = Math.floor((stageMidY + shiftY) % 50) + 0.5;

        while (netX < stageWidth) {
            this.ctx.beginPath();
            this.ctx.moveTo(netX, 0);
            this.ctx.lineTo(netX, stageHeight);
            this.ctx.stroke();
            netX += 50;
        }

        while (netY < stageHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, netY);
            this.ctx.lineTo(stageWidth, netY);
            this.ctx.stroke();
            netY += 50;
        }

        this.ctx.restore();

        // 绘制 [安全岛边界]
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(shiftX, shiftY, data.stage.radius, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.restore();
        
        // 根据socket数据更新this.entities
        for (var k in data.entities.player) {
            if (data.entities.player.qq !== 10000 && !this.entities.player[k]) {
                this.createPlayer(k, data.entities.player[k]);
            }
        }
        for (var k in this.entities.player) {
            if (!data.entities.player[k]) {
                delete this.entities.player[k];
            } else {
                this.entities.player[k].x = shiftX + data.entities.player[k].x;
                this.entities.player[k].y = shiftY + data.entities.player[k].y;
                this.entities.player[k].radius = data.entities.player[k].radius;
            }
        }

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
        // 头像
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(arr.x, arr.y, arr.radius, 0, Math.PI * 2, true);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(arr.img, arr.x - arr.radius, arr.y - arr.radius, arr.radius * 2, arr.radius * 2);
        this.ctx.restore();
        // 名字
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = "#8A2BE2";
        var str = 'bold ' + Math.floor(arr.radius / 1.75) + 'px "Microsoft Yahei"';
        this.ctx.font = str;
        this.ctx.fillText(arr.name, arr.x, arr.y + arr.radius*1.75);
    }

    createPlayer(id,arr) {
        this.entities.player[id] = {
            'x': arr.x,
            'y': arr.y,
            'name': arr.name,
            'radius': arr.radius,
            'img': null
        };
        var url = 'http://q1.qlogo.cn/g?b=qq&nk=' + arr.qq + '&s=4';
        var img = new Image();
        img.src = url;
        img.onload = function () {
            cv.entities.player[id].img = img;
        };
    }

}

var cv = new canvas();

var socket = io();

socket.on('update', function (data) {
    cv.self = data.id;
    cv.update(data);
});


// 鼠标移动
cv.c.onmousemove = function (e) {
    if (!mc) {
        mc = true;
        var location = getLocation(e.clientX, e.clientY);
        mousePosition.x = location.x - cv.c.width / 2;
        mousePosition.y = location.y - cv.c.height / 2; 
    }
}

// 鼠标移动内置CD
setInterval(function () {
    mc = false;
    if (cv.selft !== '') {
        socket.emit('move', mousePosition);
    }
}, 1000 / 45);

function inputQQ() {
    var qq = parseInt(prompt('请输入您的QQ：'));
    if (qq > 10000 && qq < 99999999999) {
        socket.emit('newPlayer', qq);
    } else {
        inputQQ();
    }
}

inputQQ();

function getLocation(x, y) {
    var bbox = cv.c.getBoundingClientRect();
    return {
        x: (x - bbox.left) * (cv.c.width / bbox.width),
        y: (y - bbox.top) * (cv.c.height / bbox.height)
    };
}
