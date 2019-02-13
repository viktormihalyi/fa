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

        this.lines = new LinesGeometry();
    }
    update(gl, keysPressed) {
        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        // clear the screen
        gl.clearColor(1, 1, 1, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.solidProgram.commit();
        // this.triangles.draw();
    }
}



