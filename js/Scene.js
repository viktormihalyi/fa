"use strict";

// https://en.wikipedia.org/wiki/File:Catmull-Rom_Parameterized_Time.png
// centripetal: alpha = 0.5
// uniform:     alpha = 0
// chordal:     alpha = 1
const ALPHA = 1;
const EPSILON = 1e-2;

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

function tj(ti, pi, pj) {
    let len = Math.max(EPSILON, pj.minus(pi).length());
    return Math.pow(len, ALPHA) + ti;
}


class Scene {
    constructor(gl) {
        this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
        this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
        this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

        this.uniforms = {};
        UniformReflection.addProperties(gl, this.solidProgram.glProgram, this.uniforms);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        this.camera = new PerspectiveCamera();
        this.tree = new Tree();

        this.treeTexture = new Texture2D(gl, `./pine.png`);

        this.treeGeometry = new TreeGeometry(gl);
        this.frenetGeometry = new FrenetGeometry(gl);

        this.last_tree_count = this.tree.nodes.length;

        this.BG_COLOR = new Vec3(1, 1, 1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.lastGrowth = this.timeAtFirstFrame;

        this.mode = 1;

        this.bs = new BezierSurfaceGeometry(gl);
    }

    update(gl, keysPressed) {

        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        if (timeAtThisFrame - this.lastGrowth > 33) {
            this.lastGrowth = timeAtThisFrame;

            this.tree.grow();

            if (this.tree.nodes.length !== this.last_tree_count) {
                this.treeGeometry.setPoints(this.tree.nodes);
                this.frenetGeometry.setPoints(this.tree.nodes);
                // this.bs.setTree(this.tree);
            }
            this.last_tree_count = this.tree.nodes.length;
        }

        // clear the screen
        gl.clearColor(this.BG_COLOR.x, this.BG_COLOR.y, this.BG_COLOR.z, 1);
        // gl.clearColor(0.8, 0.902, 0.902, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // render
        this.solidProgram.commit();


        this.camera.move(dt, keysPressed);

        Uniforms.camera.viewProj.set(this.camera.viewProjMatrix);
        Uniforms.tex.tree.set(this.treeTexture, 0);
        UniformReflection.commitProperties(gl, this.solidProgram.glProgram, this.uniforms);

        if (keysPressed['1']) {
            this.mode = 1;
        }
        if (keysPressed['2']) {
            this.mode = 2;
        }

        // this.bs.draw();

        if (this.mode === 2) {
            this.treeGeometry.draw(true);
            this.frenetGeometry.draw();

        } else {
            this.treeGeometry.draw();
        }
    }

    onresize(width, height) {
        this.camera.setAspectRatio(width / height);
    }

    onmousedown(event) {
        this.camera.mouseDown(event);
    }
    onmousemove(event) {
        this.camera.mouseMove(event);
    }
    onmouseup(event) {
        this.camera.mouseUp(event);
    };
}



