class Twig {
    public position: Vec3;
    public tangent: Vec3;
    public normal: Vec3;
    public binormal: Vec3;
    public orientationMatrix: Mat4;
    public modelMatrix: Mat4;

    constructor(position: Vec3, treeTangent: Vec3, treeNormal: Vec3, i: number) {
        this.position = position;

        // make the twig stick out of the tree
        this.tangent = treeTangent.times(2).plus(treeNormal).normalize();

        this.binormal = this.tangent.cross(treeNormal).normalize();
        this.normal = this.tangent.cross(this.binormal).normalize();

        this.orientationMatrix = createOrientationMatrix(this.tangent, this.normal, this.binormal);
        this.modelMatrix = new Mat4()
            .scale(randomBetweenFloat(0.02, 0.25))
            .mul(this.orientationMatrix)
            .rotate(rad(randomBetween(0, 360)), treeTangent)
            .translate(this.position);
    }
}
