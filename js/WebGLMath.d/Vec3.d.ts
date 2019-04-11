
declare class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor();
    constructor(x: Vec3);
    constructor(x: number, y: number, z: number);

    clone(): Vec3;

    set(v: Vec3): this;
    set(x: number, y: number, z: number): this;

    length(): number;
    length2(): number;

    add(v: Vec3): this;
    add(x: number, y: number, z: number): this;
    addScaled(t: number, v: Vec3): this;

    sub(v: Vec3): this;
    sub(x: number, y: number, z: number): this;

    mul(v: Vec3): this;
    mul(x: number, y: number, z: number): this;
    mul(t: number): this;

    div(v: Vec3): this;
    div(x: number, y: number, z: number): this;

    plus(v: Vec3): Vec3;
    minus(v: Vec3): Vec3;
    times(t: number): Vec3;
    over(t: number): Vec3;

    cross(v: Vec3): Vec3;
    dot(v: Vec3): number;

    setVectorProduct(a: Vec3, b: Vec3): this;

    normalize(): this;
}