const EquationRenderWorker = () => {
    let canvas;
    let ctx;
    let zoom, currentX, currentY;
    let equation;
    let width, height;

    const PixelPerPointInfo = 100;

    function render() {
        canvasClear();
        drawZeroGrid();
        if(!equation) return;
        drawGraph();
    }

    function canvasClear() {
        ctx.clearRect(-width >> 1, -height >> 1, width, height);
    }

    function pointTo(point) {
        if(point < 1) {
            point = clamp(point, 0.001, 1);
            let calc = 1000;
            if(point < 0.01) calc = 1000;
            else if(point < 0.1) calc = 100;
            else if(point < 1) calc = 10;
            return Math.floor(point * calc) / calc;
        }
        point = Math.floor(point);
        if(point < 5) return point;
        if(point < 10) return 5;
        if(point < 100) return Math.floor(point / 10) * 10;
        if(point < 1000) return Math.floor(point / 100) * 100;
        return Math.floor(point / 1000) * 1000;
    }

    function pointStart(v, point) {
        v = Math.floor(v);
        return v - v % point;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function drawZeroGrid() {
        const originStyle = ctx.strokeStyle, originWidth = ctx.lineWidth;

        const dw = width >> 1;
        const dh = height >> 1;
        const point = pointTo(PixelPerPointInfo / zoom);
        const pixelPerPoint = zoom * point;


        const startX = pointStart(-dw / zoom + currentX, point);
        const startPixelX = (startX - currentX) * zoom;
        let pointX = startX;
        const drawY = clamp(-currentY * zoom + 12, -dh + 9, dh - 11);

        ctx.font = '13px serif';
        for(let x = startPixelX; x < dw; x += pixelPerPoint) {
            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.strokeText(parseFloat(pointX.toFixed(4)), x + 1, drawY);
            ctx.stroke();
            pointX += point;

            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
            ctx.moveTo(x, dh);
            ctx.lineTo(x, -dh);
            ctx.stroke();

            const div4 = pixelPerPoint / 5;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            for(let i = x + div4, check = x + pixelPerPoint; i < check; i += div4) {
                ctx.moveTo(i, dh);
                ctx.lineTo(i, -dh);
            }
            ctx.stroke();
        }

        const originAlign = ctx.textAlign;
        const startY = pointStart(-dh / zoom + currentY, point);
        const startPixelY = (startY - currentY) * zoom;
        let pointY = startY;
        const drawX = clamp(-currentX * zoom + 9, -dw + 9, dw - 15);
        if(drawX > dw - 20) ctx.textAlign = "right";
        for(let y = startPixelY; y < dh; y += pixelPerPoint) {
            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.strokeText(parseFloat(-pointY).toFixed(4)), drawX - 8, y + 12);
            ctx.stroke();
            pointY += point;

            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
            ctx.moveTo(dw, y);
            ctx.lineTo(-dw, y);
            ctx.stroke();

            const div4 = pixelPerPoint / 5;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            for(let i = y + div4, check = y + pixelPerPoint; i < check; i += div4) {
                ctx.moveTo(dw, i);
                ctx.lineTo(-dw, i);
            }
            ctx.stroke();
        }
        ctx.textAlign = originAlign;

        // ctx.beginPath();
        // ctx.moveTo(0, -pixelPerPoint);
        // ctx.lineTo(0, 0);
        // ctx.moveTo(startPixelX, 0);
        // ctx.lineTo(0, 0);
        // ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        ctx.moveTo(-currentX * zoom, -dh);
        ctx.lineTo(-currentX * zoom, dh);
        
        ctx.moveTo(-dw, -currentY * zoom);
        ctx.lineTo(dw, -currentY * zoom);

        // ctx.setLineDash([3, 3]);
        ctx.stroke();

        // ctx.setLineDash([]);
        ctx.strokeStyle = originStyle;
        ctx.lineWidth = originWidth;
    }

    function drawGraph() {
        const originStyle = ctx.strokeStyle;
        ctx.strokeStyle = "red";

        const dw = width >> 1;
        const dh = height >> 1;

        ctx.beginPath();
        let isMoved = false;
        for(let x = -dw; x <= dw; x++) {
            const posX = x / zoom + currentX;
            let posY = (equation.calc(posX) + currentY) * zoom;
            // let posY = (Math.tan(posX) + currentY) * zoom;
            if(isNaN(posY)) {
                isMoved = false;
                continue;
            }
            posY = clamp(posY, -dh - 1, dh + 1);

            if(!isMoved) {
                isMoved = true;
                ctx.moveTo(x, -posY);
            }
            ctx.lineTo(x, -posY);
        }
        ctx.stroke();

        ctx.strokeStyle = originStyle;
    }

    self.addEventListener("message", e => {
        const data = e.data;
        switch(data.type) {
            case "import":
                importScripts(data.data);
                break;
            case "canvas":
                canvas = data.data;
                ctx = canvas.getContext("2d");
                width = canvas.width;
                height = canvas.height;
                ctx.translate(width / 2, height / 2);
                render();
                break;
            case "equation":
                equation = new Equation(data.data);
                render();
                break;
            case "resize":
                width = canvas.width = data.data[0];
                height = canvas.height = data.data[1];
                ctx.translate(width >> 1, height >> 1);
                render();
                break;
            case "update":
                zoom = data.data[0];
                currentX = data.data[1];
                currentY = data.data[2];
                render();
                break;
        }
    });
}
