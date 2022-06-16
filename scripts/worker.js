const EquationRenderWorker = () => {
    let canvas;
    let ctx;
    let zoom, currentX, currentY;
    let equation;
    let width, height;

    function render() {
        canvasClear();
        drawZeroGrid();
        if(!equation) return;
        drawGraph();
    }

    function canvasClear() {
        ctx.clearRect(-width >> 1, -height >> 1, width, height);
    }

    function drawZeroGrid() {
        const originStyle = ctx.strokeStyle;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";

        ctx.beginPath();
        ctx.moveTo(-currentX * zoom, -height >> 1);
        ctx.lineTo(-currentX * zoom, height >> 1);
        
        ctx.moveTo(-width >> 1, -currentY * zoom);
        ctx.lineTo(width >> 1, -currentY * zoom);

        ctx.setLineDash([3, 3]);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = originStyle;
    }

    function drawGraph() {
        const originStyle = ctx.strokeStyle;
        ctx.strokeStyle = "red";

        const dw = width >> 1;
        // const dh = height >> 1;

        ctx.beginPath();
        let isMoved = false;
        for(let x = -dw; x <= dw; x++) {
            const posX = x / zoom + currentX;
            const posY = -(equation.calc(posX) * zoom - currentY);
            //const posY = (Math.sin(posX) + currentY) * zoom;
            if(isNaN(posY)) {
                isMoved = false;
                continue;
            }

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
                console.log(equation, equation.origin);
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