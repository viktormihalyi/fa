class GameObject {
    public mesh: Mesh;
    public position: Vec3;
    public orientation: number;
    public orientationVector: Vec3;
    public scale: Vec3;
    public modelMatrix: Mat4;

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.position = new Vec3(0, 0, 0);
        this.orientation = 0;
        this.orientationVector = new Vec3(0, 1, 0);
        this.scale = new Vec3(1, 1, 1);
        this.modelMatrix = new Mat4();
    }

    updateModelMatrix(): void {
        this.modelMatrix.set()
            .scale(this.scale)
            .rotate(this.orientation, this.orientationVector)
            .translate(this.position);
    }

    draw(other_material?: Material): void {
        this.updateModelMatrix();
        Uniforms.camera.modelMatrix.set(this.modelMatrix);
        this.mesh.draw(other_material);
    }
}