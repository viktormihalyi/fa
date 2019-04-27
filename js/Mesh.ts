class Mesh {
    public geometry: IGeometry;
    public material: Material;

    constructor(geometry: IGeometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    draw(other_material?: Material): void {
        if (other_material) {
            other_material.commit();
        } else {
            this.material.commit();
        }
        this.geometry.draw();
    }
}