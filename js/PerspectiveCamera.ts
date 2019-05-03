class PerspectiveCamera {
    public static readonly WORLD_UP: Vec3 = new Vec3(0, 1, 0);

    public position: Vec3;
    public ahead: Vec3;
    public right: Vec3;
    public up: Vec3;
    public yaw: number;
    public pitch: number;
    public fov: number;
    public aspect: number;
    public nearPlane: number;
    public farPlane: number;
    public speed: number;
    public dragSpeed: number;
    public isDragging: boolean;
    public mouseDelta: Vec2;
    public viewMatrix: Mat4;
    public projMatrix: Mat4;
    public viewProjMatrix: Mat4;
    public rayDirMatrix: Mat4;


    constructor() {
        this.position = new Vec3(-800.0, 250.0, 0.0);
        this.ahead = new Vec3(1.0, 0.0, 0.0);
        this.right = new Vec3(0.0, 0.0, 1.0);
        this.up = new Vec3(0.0, 1.0, 0.0);

        this.yaw = -Math.PI/2;
        this.pitch = 0.0;

        this.ahead = new Vec3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
        this.right.setVectorProduct(this.ahead, PerspectiveCamera.WORLD_UP);
        this.right.normalize();
        this.up.setVectorProduct(this.right, this.ahead);

        this.fov = radians(90);
        this.aspect = 1.0;
        this.nearPlane = 0.5;
        this.farPlane = 5000;

        this.speed = 300;
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

    public updateViewMatrix(): void {
        this.viewMatrix.set(lookAt(this.position, this.position.plus(this.ahead), PerspectiveCamera.WORLD_UP));
        this.viewProjMatrix.set(this.viewMatrix).mul(this.projMatrix);
    }

    public updateProjMatrix(): void {
        this.projMatrix.set(projection(this.fov, this.aspect, this.nearPlane, this.farPlane));
        this.viewProjMatrix.set(this.viewMatrix).mul(this.projMatrix);
    }

    public updateRayDirMatrix(): void {
        this.rayDirMatrix.set().translate(this.position).mul(this.viewMatrix).mul(this.projMatrix).invert();
    }

    public move(dt: number, keysPressed: any): void {
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
            this.right.setVectorProduct(this.ahead, PerspectiveCamera.WORLD_UP);
            this.right.normalize();
            this.up.setVectorProduct(this.right, this.ahead);
        }
        if (keysPressed.SHIFT) {
            this.speed /= 10;
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
            this.position.addScaled(this.speed * dt, PerspectiveCamera.WORLD_UP);
        }
        if (keysPressed.Q) {
            this.position.addScaled(-this.speed * dt, PerspectiveCamera.WORLD_UP);
        }
        if (keysPressed.SHIFT) {
            this.speed *= 10;
        }
        this.updateViewMatrix();
        this.updateRayDirMatrix();
        this.updateProjMatrix();
    }

    public setAspectRatio(ar: number): void {
        this.aspect = ar;
        this.updateProjMatrix();
    }

    public mouseDown(): void {
        this.isDragging = true;
        this.mouseDelta.set();
    }

    public mouseMove(event: MouseEvent): void {
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
        event.preventDefault();
    }

    private lastTouch: TouchEvent | undefined;
    public touchMove(event: TouchEvent): void {
        this.mouseDelta.x += event.touches[0].clientX;
        this.mouseDelta.y += event.touches[0].clientY;
        this.lastTouch = event;
    }

    public mouseUp(): void {
        this.isDragging = false;
    }
}