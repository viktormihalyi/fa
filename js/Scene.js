"use strict";

// https://en.wikipedia.org/wiki/Cubic_Hermite_spline
// p0: starting point
// p1: ending point
// m0: starting tangent
// m1: ending tangent
function cubic_hermit_spline(p0, p1, m0, m1, t) {
    const t2 = t*t;
    const t3 = t2*t;

    const a = 2*t3 - 3*t2 + 1;
    const b = t3 - 2*t2 + t;
    const c = -2*t3 + 3*t2;
    const d = t3 - t3;

    return p0.times(a).plus(m0.times(b)).plus(p1.times(c)).plus(m1.times(d));
}

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

// https://en.wikipedia.org/wiki/Cubic_Hermite_spline
// pp: previous point before starting point (when null, pp = p0)
// p0: starting point
// p1: ending point
// pn: next point after ending point (when null, pn = p1)
function catmull_rom_spline(pp, p0, p1, pn, t) {
    const m0 = p1.minus(pp || p0).times(0.5);
    const m1 = (pn || p1).minus(p0).times(0.5);
    return cubic_hermit_spline(p0, p1, m0, m1, t);
}

let p0 = new Vec2(0, 0);
let p1 = new Vec2(5, 5);
let pp = new Vec2(2, -3);
let pn = new Vec2(10, 2);

for (let t = 0; t <= 1; t += 0.01) {
    const point = catmull_rom_spline(pp, p0, p1, pn, t);
    console.log(`x=${point.x}, y=${point.y}`);
}

class Scene {
    constructor(gl) {
        this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
        this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
        this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        this.camera = new Camera();
        this.tree = new Tree();
        this.linesGeometry = new LinesGeometry(gl);

        this.last_tree_count = this.tree.nodes.length;
    }

    update(gl, keysPressed) {
        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        this.tree.grow();
        if (this.tree.nodes.length !== this.last_tree_count) {
            this.linesGeometry.setPoints(this.tree.nodes);
        }
        this.last_tree_count = this.tree.nodes.length;

        // clear the screen
        gl.clearColor(1, 1, 1, 1.0);
        // gl.clearColor(0.8, 0.902, 0.902, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // render
        this.solidProgram.commit();
        this.camera.eyePos.x = 55*Math.sin(t/40);
        this.camera.eyePos.y = this.camera.target.y = 33;
        this.camera.eyePos.z = 55*Math.cos(t/40);
        this.camera.V().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "V"));
        this.camera.P().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "P"));


        this.linesGeometry.draw();
    }
}



