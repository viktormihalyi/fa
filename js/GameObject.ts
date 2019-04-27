class GameObject {
    public readonly mesh: Mesh;
    public position: Vec3;
    public orientation: number;
    public orientationVector: Vec3;
    public scale: Vec3;
    public modelMatrix: Mat4;
    public readonly isInstaced: boolean;

    constructor(mesh: Mesh, isInstaced: boolean = false) {
        this.mesh = mesh;
        this.position = new Vec3(0, 0, 0);
        this.orientation = 0;
        this.orientationVector = new Vec3(0, 1, 0);
        this.scale = new Vec3(1, 1, 1);
        this.modelMatrix = new Mat4();
        this.isInstaced = isInstaced;
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