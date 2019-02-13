"use strict";

class Camera {
    constructor() {
        this.fov = 90 * Math.PI / 180.0;
        this.asp = window.innerWidth/window.innerHeight;

        this.eyePos = new Vec3(-65, 0, 0);
        this.target = new Vec3(0, 0, 0);
        this.up     = new Vec3(0, 1, 0);
    }

    V() {
        const camera_lookat = this.eyePos.minus(this.target).normalize();
        const camera_right  = this.up.cross(camera_lookat).normalize();
        const camera_up     = camera_lookat.cross(camera_right);

        return new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -this.eyePos.x, -this.eyePos.y, -this.eyePos.z, 1,
        ).mul(new Mat4(
            camera_right.x, camera_up.x, camera_lookat.x, 0,
            camera_right.y, camera_up.y, camera_lookat.y, 0,
            camera_right.z, camera_up.z, camera_lookat.z, 0,
            0, 0, 0, 1
        ));
    }

    P() {
        const fp = 0.1;
        const bp = 1000;
        const tanfov2 = Math.tan(this.fov / 2);
        return new Mat4(
            1 / (tanfov2*this.asp), 0,           0,                       0,
            0,                      1 / tanfov2, 0,                       0,
            0,                      0,           -(fp + bp) / (bp - fp), -1,
            0,                      0,           -2 * fp*bp / (bp - fp),  0
        );
    }
}