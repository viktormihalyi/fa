class Mesh {
    public geometry: IGeometry;
    public material: Material;

    constructor(geometry: IGeometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    draw(other_material?: Material): void {
        (other_material || this.material).commit();
        this.geometry.draw();
    }
}