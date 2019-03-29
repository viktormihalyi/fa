"use strict";
class GameObject {
    constructor(mesh) {
        this.mesh = mesh;
        this.position = new Vec3(0, 0, 0);
        this.orientation = 0;
        this.scale = new Vec3(1, 1, 1);
        this.modelMatrix = new Mat4();
    }

    updateModelMatrix() {
        this.modelMatrix.set()
            .scale(this.scale)
            .rotate(this.orientation)
            .translate(this.position);
    }

    draw(camera) {
        this.updateModelMatrix();
        Uniforms.camera.viewProj.set(camera.viewProjMatrix);
        Uniforms.camera.wEye.set(camera.position);
        this.mesh.draw();
    }
}