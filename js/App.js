"use strict";
class App {
    constructor(canvas, status) {
        this.canvas = canvas;
        this.status = status;
        // obtain WebGL context
        this.gl = canvas.getContext("webgl2");
        if (this.gl === null) {
            throw new Error("Browser does not support WebGL2");
        }
        this.keysPressed = {};
        // serves as a registry for textures or models being loaded
        this.gl.pendingResources = {};
        // create a simple scene
        this.scene = new Scene(this.gl);
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
        this.canvas.onmousedown = (event) => {
            this.scene.onmousedown(event);
        };
        this.canvas.onmousemove = (event) => {
            this.scene.onmousemove(event);
            event.stopPropagation();
        };
        this.canvas.onmouseout = (event) => {
        };
        this.canvas.onmouseup = (event) => {
            this.scene.onmouseup(event);
        };
        window.addEventListener('resize', () => this.resize());
        window.requestAnimationFrame(() => this.update());
    }
    // animation frame update
    update() {
        const pendingResourceNames = Object.keys(this.gl.pendingResources);
        if (pendingResourceNames.length === 0) {
            // animate and draw scene
            this.scene.update(this.gl, this.keysPressed);
            this.status.innerHTML = "WASDQE for moving around<br>1 - normal mode<br>2 - debug mode";
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
    const canvas = document.getElementById("canvas");
    const status = document.getElementById("status");
    status.innerText = "loading...";

    app = new App(canvas, status);
    app.registerEventHandlers();
});
