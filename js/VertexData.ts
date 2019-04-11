"use strict";
class VertexData {
    public position: Vec3;
    public normal: Vec3;
    public uv: Vec2;
    public tangent: Vec3;
    public bitangent: Vec3;

    constructor(position: Vec3, normal: Vec3, uv = new Vec2(), tangent = new Vec3(), bitangent  = new Vec3()) {
        this.position = position;
        this.normal = normal;
        this.uv = uv;
        this.tangent = tangent;
        this.bitangent = bitangent;
    }
}
