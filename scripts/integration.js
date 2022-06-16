const Integration = new class {
    #offscreenCanvas;
    #worker;
    constructor() {
        this.#loadWorker();
        this.#loadCanvas();
        this.#resizeEvent();
    }

    #resizeEvent() {
        window.addEventListener("resize", _ => {
            this.#worker.postMessage({
                "type": "resize",
                "data": [window.innerWidth, window.innerHeight]
            });
        })
    }

    #loadCanvas() {
        const canvas = document.getElementsByClassName("canvas")[0];
        this.#offscreenCanvas = canvas.transferControlToOffscreen();
        this.#offscreenCanvas.width = window.innerWidth;
        this.#offscreenCanvas.height = window.innerHeight;
        
        this.#worker.postMessage({
            "type": "canvas",
            "data": this.#offscreenCanvas
        }, [this.#offscreenCanvas]);

        let zoom = 50.3;
        let x = 0, y = 0;

        const sendCanvasInfo = () => {
            this.#worker.postMessage({
                "type": "update",
                "data": [zoom, x, y]
            });
        }
        sendCanvasInfo();

        canvas.addEventListener("wheel", e => {
            zoom = this.#clamp(zoom + e.wheelDelta / 120 * zoom * .08, 1e-10, 1e+10);
            sendCanvasInfo();
        });

        canvas.addEventListener("mousemove", e => {
            if(e.which != 1) return;
            //x += e.movementX * zoom * .08;
            //y += e.movementY * zoom * .08;
            x -= e.movementX / zoom;
            y -= e.movementY / zoom;
            sendCanvasInfo();
        });

        let touch = {x:0, y:0, distance: 0};
        canvas.addEventListener("touchstart", e => {
            touch.x = e.touches[0].pageX;
            touch.y = e.touches[0].pageY;
        });
        canvas.addEventListener("touchmove", e => {
            e.preventDefault();

            if(e.touches.length == 2) {
                const distance = Math.pow((e.touches[0].pageX - e.touches[1].pageX), 2) + Math.pow((e.touches[0].pageY - e.touches[1].pageY), 2);
                const wheel = touch.distance < distance
                    ? 1
                    : touch.distance > distance
                        ? -1
                        : 0;
                touch.distance = distance;
                zoom = this.#clamp(zoom + wheel * zoom * .03, 1e-10, 1e+10);
                touch.x = e.touches[0].pageX;
                touch.y = e.touches[0].pageY;
                sendCanvasInfo();
                return;
            }

            const movementX = e.touches[0].pageX - touch.x;
            const movementY = e.touches[0].pageY - touch.y;
            touch.x = e.touches[0].pageX;
            touch.y = e.touches[0].pageY;
            x -= movementX / zoom;
            y -= movementY / zoom;
            sendCanvasInfo();
        })
    }

    #clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    #loadWorker() {
        const workerURL = URL.createObjectURL(new Blob([`(${EquationRenderWorker.toString()})()`], {type: "text/javascript"}));
        const equationURL = URL.createObjectURL(new Blob([Equation.toString()], {type: "text/javascript"}));

        this.#worker = new Worker(workerURL);
        this.#worker.postMessage({
            "type": "import",
            "data": equationURL
        });
    }
    
    /**
     * @param {Equation} equation Draw equation graph.
     */
    draw(equation) {
        this.#worker.postMessage({
            "type": "equation",
            "data": equation.origin
        });
    }
}

const getElementByClass = className => document.getElementsByClassName(className)[0];

const valueChangedTimeout = (callback, element, time) => {
    let timeout;
    element.addEventListener("keyup", () => {
        if(timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, time);
    });
}

let equation;
valueChangedTimeout(() => {
    const result = getElementByClass("result");
    const x = parseFloat(getElementByClass("x_value").value);
    result.innerText = equation?.calc(x);
}, getElementByClass("x_value"), 5);

const eq = getElementByClass("equation");
eq.addEventListener("change", e => {
    try {
        equation = new Equation(e.target.value);
        Integration.draw(equation);
    }catch(e) {
        getElementByClass("result").innerText = "error";
        console.error(e)
    }
})
