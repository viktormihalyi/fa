class App {
    // serves as a registry for textures or models being loaded
    public static pendingResources: any = {};

    private gl: WebGL2RenderingContext;
    private keysPressed: any;
    public canvas: HTMLCanvasElement;
    private status: HTMLElement;
    private scene: Scene;

    constructor(canvas: HTMLCanvasElement, status: HTMLElement) {
        this.canvas = canvas;
        this.status = status;
        // obtain WebGL context
        this.gl = canvas.getContext("webgl2")!;
        if (this.gl === null) {
            throw new Error("Browser does not support WebGL2");
        }
        this.keysPressed = {};

        // create a simple scene
        this.scene = new Scene(this.gl, this);
        this.resize();
    }
    // match WebGL rendering resolution and viewport to the canvas size
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.scene.onresize(this.canvas.width, this.canvas.height);
    }
    registerEventHandlers() {
        document.onkeydown = (event) => {
            this.keysPressed[keyboardMap[event.keyCode]] = true;
        };
        document.onkeyup = (event) => {
            this.keysPressed[keyboardMap[event.keyCode]] = false;
        };
        this.canvas.onmousedown = () => {
            this.scene.onmousedown();
        };
        this.canvas.onmousemove = (event) => {
            this.scene.onmousemove(event);
            event.stopPropagation();
        };
        this.canvas.onmouseout = () => {
            this.scene.onmouseup();
        };
        this.canvas.onmouseup = () => {
            this.scene.onmouseup();
        };
        this.canvas.ontouchmove = (event) => {
            this.scene.ontouch(event);
            event.stopPropagation();
        }
        window.addEventListener('resize', () => this.resize());
        window.requestAnimationFrame(() => this.update());
    }
    // animation frame update
    update() {
        const pendingResourceNames = Object.keys(App.pendingResources);
        if (pendingResourceNames.length === 0) {
            // animate and draw scene
            this.scene.update(this.gl, this.keysPressed);
            this.status.innerHTML = "ready";
        }
        else {
            this.status.innerText = "loading: " + pendingResourceNames;
        }
        // refresh
        window.requestAnimationFrame(() => this.update());
    }
}

let app;
// entry point from HTML
window.addEventListener('load', function () {
    const canvas = document.getElementById("canvas")!;
    const status = document.getElementById("status")!;
    status.innerText = "loading...";

    app = new App(<HTMLCanvasElement>canvas, status);
    app.registerEventHandlers();
});
