"use strict";

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

const ALPHA = 1;
const EPSILON = 1e-5;

function tj(ti, pi, pj) {
    let len = Math.max(EPSILON, pj.minus(pi).length());
    return Math.pow(len, ALPHA) + ti;
}

// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
// centripetal catmull rom spline
function catmull_rom_spline(p0, p1, p2, p3, t) {
    const t0 = 0;
    const t1 = tj(t0, p0, p1);
    const t2 = tj(t1, p1, p2);
    const t3 = tj(t2, p2, p3);

    t = lerp(t1, t2, t);

    const a1 = p0.times((t1-t) / (t1-t0)).plus(p1.times((t-t0) / (t1-t0)));
    const a2 = p1.times((t2-t) / (t2-t1)).plus(p2.times((t-t1) / (t2-t1)));
    const a3 = p2.times((t3-t) / (t3-t2)).plus(p3.times((t-t2) / (t3-t2)));

    const b1 = a1.times((t2-t) / (t2-t0)).plus(a2.times((t-t0) / (t2-t0)));
    const b2 = a2.times((t3-t) / (t3-t1)).plus(a3.times((t-t1) / (t3-t1)));

    const c  = b1.times((t2-t) / (t2-t1)).plus(b2.times((t-t1) / (t2-t1)));
    return c;
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

        let pp = new Vec3(-2, -3, 0);
        let p0 = new Vec3(0, 0, 0);
        let p1 = new Vec3(5, 5, 0);
        let pn = new Vec3(7, 0, 0);

        for (let t = 0; t <= 1; t += 0.2) {
            const point = catmull_rom_spline(pp, p0, p1, pn, t);
            console.log(pv(point));
        }

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
        if (!keysPressed['SPACE']) {
            this.camera.eyePos.x = 55*Math.sin(t/1);
            this.camera.eyePos.y = this.camera.target.y = 33;
            this.camera.eyePos.z = 55*Math.cos(t/1);
        }
        this.camera.V().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "V"));
        this.camera.P().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "P"));


        this.linesGeometry.draw();
    }
}



