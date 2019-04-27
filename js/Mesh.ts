class Mesh {
    private geometry: IGeometry;
    private material: Material;
    private depthMaterial?: Material;

    constructor(geometry: IGeometry, material: Material, depthMaterial?: Material) {
        this.geometry = geometry;
        this.material = material;
        this.depthMaterial = depthMaterial;
    }

    draw(depth: boolean): void {
        if (depth && this.depthMaterial) {
            this.depthMaterial.commit();
        } else {
            this.material.commit();
        }
        this.geometry.draw();
    }
}