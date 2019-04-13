declare class Vec3 {
    storage: Float32Array;
    x: number;
    y: number;
    z: number;


    constructor();
    constructor(x: Vec3);
    constructor(x: number, y: number, z: number);

    clone(): Vec3;

    set(): this;
    set(v: Vec3): this;
    set(x: number, y: number, z: number): this;
    setRandom(minVal: number|Vec3, maxVal: number|Vec3): this;

    clamp(minVal: number|Vec3, maxVal: number|Vec3): this;
    setClamped(v: Vec3, minVal: number|Vec3, maxVal: number|Vec3): this;

    // +=
    add(v: Vec3): this;
    add(x: number, y: number, z: number): this;
    addScaled(t: number, v: Vec3): this;
    addScaled(t: number, x: number, y: number, z: number): this;
    // +
    plus(v: Vec3): Vec3;
    plus(x: number, y: number, z: number): Vec3;
    // = v1 + v2
    setSum(v1: Vec3, v2: Vec3): this;

    // -=
    sub(v: Vec3): this;
    sub(x: number, y: number, z: number): this;
    // -
    minus(v: Vec3): Vec3;
    minus(x: number, y: number, z: number): Vec3;
    // = v1 - v2
    setDifference(v1: Vec3, v2: Vec3): this;

    // *=
    mul(v: Vec3): this;
    mul(x: number, y: number, z: number): this;
    mul(t: number): this;
    // *
    times(v: Vec3): Vec3;
    times(x: number, y: number, z: number): Vec3;
    times(t: number): Vec3;
    xyz1times(m: Mat4): Vec3;
    xyz0times(m: Mat4): Vec3;
    // = v1 * v2
    setProduct(v1: Vec3, v2: Vec3): this;

    // /=
    div(v: Vec3): this;
    div(x: number, y: number, z: number): this;
    div(t: number): this;
    // /
    over(v: Vec3): Vec3;
    over(x: number, y: number, z: number): Vec3;
    over(t: number): Vec3;
    // = v1 / v2
    setQuotient(v1: Vec3, v2: Vec3): this;

    // = v * t
    setScaled(v: Vec3, t: number): this;

    // = v / t
    setScaledByInverse(v: Vec3, t: number): this;

    length2(): number;
    length(): number;

    normalize(): this;
    driection(): Vec3;

    setNormalized(v: Vec3): Vec3;

    dot(v: Vec3): number;
    dot(x: number, y: number, z: number): number;

    cross(v: Vec3): Vec3;
    cross(x: number, y: number, z: number): Vec3;

    setVectorProduct(a: Vec3, b: Vec3): this;

    xyz1mul(m: Mat4): this;
    setxyz1Transformed(v: Vec3, m: Mat4): this;

    xyz0mul(m: Mat4): this;
    setxyz0Transformed(v: Vec3, m: Mat4): this;

    commit(gl: WebGL2RenderingContext, uniformLocation: WebGLUniformLocation): void;

    static random(minVal: number|Vec3, maxVal: number|Vec3): Vec3;
}
