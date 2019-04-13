declare class Vec4 {
    storage: Float32Array;
    x: number;
    y: number;
    z: number;
    w: number;

    constructor();
    constructor(x: Vec4);
    constructor(x: number, y: number, z: number, w: number);

    clone(): Vec4;

    set(): this;
    set(v: Vec4): this;
    set(x: number, y: number, z: number, w: number): this;
    setRandom(minVal: number|Vec4, maxVal: number|Vec4): this;

    clamp(minVal: number|Vec4, maxVal: number|Vec4): this;
    setClamped(v: Vec4, minVal: number|Vec4, maxVal: number|Vec4): this;

    // +=
    add(v: Vec4): this;
    add(x: number, y: number, z: number, w: number): this;
    addScaled(t: number, v: Vec4): this;
    addScaled(t: number, x: number, y: number, z: number, w: number): this;
    // +
    plus(v: Vec4): Vec4;
    plus(x: number, y: number, z: number, w: number): Vec4;
    // = v1 + v2
    setSum(v1: Vec4, v2: Vec4): this;

    // -=
    sub(v: Vec4): this;
    sub(x: number, y: number, z: number, w: number): this;
    // -
    minus(v: Vec4): Vec4;
    minus(x: number, y: number, z: number, w: number): Vec4;
    // = v1 - v2
    setDifference(v1: Vec4, v2: Vec4): this;

    // *=
    mul(v: Vec4): this;
    mul(x: number, y: number, z: number, w: number): this;
    mul(t: number): this;
    // *
    times(v: Vec4): Vec4;
    times(x: number, y: number, z: number, w: number): Vec4;
    times(t: number): Vec4;
    // = v1 * v2
    setProduct(v1: Vec4, v2: Vec4): this;

    // /=
    div(v: Vec4): this;
    div(x: number, y: number, z: number, w: number): this;
    // /
    over(v: Vec4): Vec4;
    over(x: number, y: number, z: number, w: number): Vec4;
    // = v1 / v2
    setQuotient(v1: Vec4, v2: Vec4): this;

    // = v * t
    setScaled(v: Vec4, t: number): this;
    // = v / t
    setScaledByInverse(v: Vec4, t: number): this;

    length2(): number;
    length(): number;

    normalize(): this;
    direction(): Vec4;

    setNormalized(v: Vec4): this;

    dot(v: Vec4): number;
    dot(x: number, y: number, z: number, w: number): number;

    transform(m: Mat4): this;
    setTransformed(v: Vec4, m: Mat4): this;

    commit(gl: WebGL2RenderingContext, uniformLocation: WebGLUniformLocation): void;
}
