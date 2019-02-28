class PerspectiveCamera {
    constructor() {
        this.position = new Vec3(-300.0, 200.0, 0.0);
        this.ahead = new Vec3(1.0, 0.0, 0.0);
        this.right = new Vec3(0.0, 0.0, 1.0);
        this.up = new Vec3(0.0, 1.0, 0.0);

        this.yaw = -Math.PI/2;
        this.pitch = 0.0;

        this.ahead = new Vec3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
        this.right.setVectorProduct(this.ahead, PerspectiveCamera.worldUp);
        this.right.normalize();
        this.up.setVectorProduct(this.right, this.ahead);

        const radians = (x) => x / 180 * Math.PI;
        this.fov = radians(90);
        this.aspect = 1.0;
        this.nearPlane = 0.1;
        this.farPlane = 1000.0;

        this.speed = 150;
        this.dragSpeed = 0.003;

        this.isDragging = false;
        this.mouseDelta = new Vec2(0.0, 0.0);
        this.viewMatrix = new Mat4();
        this.projMatrix = new Mat4();
        this.viewProjMatrix = new Mat4();
        this.rayDirMatrix = new Mat4();
        this.updateViewMatrix();
        this.updateProjMatrix();
        this.updateRayDirMatrix();
    }
    updateViewMatrix() {
        this.viewMatrix
            .set(
                 this.right.x,  this.right.y,  this.right.z, 0,
                 this.up.x,     this.up.y,     this.up.z,    0,
                -this.ahead.x, -this.ahead.y, -this.ahead.z, 0,
                0,              0,             0,            1
            )
            .translate(this.position)
            .invert();
        this.viewProjMatrix.set(this.viewMatrix).mul(this.projMatrix);
    }
    updateProjMatrix() {
        const yScale = 1.0 / Math.tan(this.fov * 0.5);
        const xScale = yScale / this.aspect;
        const f = this.farPlane;
        const n = this.nearPlane;

        this.projMatrix.set(
            xScale, 0,      0,              0,
            0,      yScale, 0,              0,
            0,      0,      (n+f) / (n-f), -1,
            0,      0,      2*n*f / (n-f),  0
        );

        this.viewProjMatrix.set(this.viewMatrix).mul(this.projMatrix);
    }
    updateRayDirMatrix() {
        this.rayDirMatrix.set().translate(this.position).mul(this.viewMatrix).mul(this.projMatrix).invert();
    }
    move(dt, keysPressed) {
        if (this.isDragging) {
            this.yaw -= this.mouseDelta.x * this.dragSpeed;
            this.pitch -= this.mouseDelta.y * this.dragSpeed;
            if (this.pitch > Math.PI / 2.0) {
                this.pitch = Math.PI / 2.0;
            }
            if (this.pitch < -Math.PI / 2.0) {
                this.pitch = -Math.PI / 2.0;
            }
            this.mouseDelta = new Vec2(0.0, 0.0);
            this.ahead = new Vec3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
            this.right.setVectorProduct(this.ahead, PerspectiveCamera.worldUp);
            this.right.normalize();
            this.up.setVectorProduct(this.right, this.ahead);
        }
        if (keysPressed.SHIFT) {
            this.speed /= 6;
        }
        if (keysPressed.W) {
            this.position.addScaled(this.speed * dt, this.ahead);
        }
        if (keysPressed.S) {
            this.position.addScaled(-this.speed * dt, this.ahead);
        }
        if (keysPressed.D) {
            this.position.addScaled(this.speed * dt, this.right);
        }
        if (keysPressed.A) {
            this.position.addScaled(-this.speed * dt, this.right);
        }
        if (keysPressed.E) {
            this.position.addScaled(this.speed * dt, PerspectiveCamera.worldUp);
        }
        if (keysPressed.Q) {
            this.position.addScaled(-this.speed * dt, PerspectiveCamera.worldUp);
        }
        if (keysPressed.SHIFT) {
            this.speed *= 6;
        }
        this.updateViewMatrix();
        this.updateRayDirMatrix();
        this.updateProjMatrix();
    }
    setAspectRatio(ar) {
        this.aspect = ar;
        this.updateProjMatrix();
    }
    mouseDown() {
        this.isDragging = true;
        this.mouseDelta.set();
    }
    mouseMove(event) {
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
        event.preventDefault();
    }
    mouseUp() {
        this.isDragging = false;
    }
}

PerspectiveCamera.worldUp = new Vec3(0, 1, 0);