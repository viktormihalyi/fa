class Mesh {
    public geometry: IGeometry;
    public material: Material;

    constructor(geometry: IGeometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    draw(): void {
        this.material.commit();
        this.geometry.draw();
    }
}