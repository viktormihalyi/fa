"use strict";

class Scene {
    constructor(gl) {
        this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
        this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
        this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        // this.quadGeometry = new QuadGeometry(gl);
        // this.triangles = new TriangleGeometryInstanced(gl);
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
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // render
        this.solidProgram.commit();
        this.camera.eyePos.x = 22*Math.sin(t/40);
        this.camera.eyePos.y = this.camera.target.y = 0;
        this.camera.eyePos.z = 22*Math.cos(t/40);
        this.camera.V().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "V"));
        this.camera.P().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "P"));


        this.linesGeometry.draw();
    }
}



