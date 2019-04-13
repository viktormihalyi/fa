declare class Vec2 {
    storage: Float32Array;
    x: number;
    y: number;



    constructor();
    constructor(x: Vec2);
    constructor(x: number, y: number);

    clone(): Vec2;

    set(): this;
    set(v: Vec2): this;
    set(x: number, y: number): this;
    setRandom(minVal: number|Vec2, maxVal: number|Vec2): this;

    clamp(minVal: number|Vec2, maxVal: number|Vec2): this;
    setClamped(v: Vec2, minVal: number|Vec2, maxVal: number|Vec2): this;

    // +=
    add(v: Vec2): this;
    add(x: number, y: number): this;
    addScaled(t: number, v: Vec2): this;
    addScaled(t: number, x: number, y: number): this;
    // +
    plus(v: Vec2): Vec2;
    plus(x: number, y: number): Vec2;
    // = v1 + v2
    setSum(v1: Vec2, v2: Vec2): this;

    // -=
    sub(v: Vec2): this;
    sub(x: number, y: number): this;
    // -
    minus(v: Vec2): Vec2;
    minus(x: number, y: number): Vec2;
    // = v1 - v2
    setDifference(v1: Vec2, v2: Vec2): this;

    // *=
    mul(v: Vec2): this;
    mul(x: number, y: number): this;
    mul(t: number): this;
    // *
    times(v: Vec2): Vec2;
    times(x: number, y: number): Vec2;
    times(t: number): Vec2;
    xy01times(m: Mat4): Vec2;
    xy00times(m: Mat4): Vec2;
    // = v1 * v2
    setProduct(v1: Vec2, v2: Vec2): this;

    // /=
    div(v: Vec2): this;
    div(x: number, y: number): this;
    div(t: number): this;
    // /
    over(v: Vec2): Vec2;
    over(x: number, y: number): Vec2;
    over(t: number): Vec2;
    // = v1 / v2
    setQuotient(v1: Vec2, v2: Vec2): this;

    // = v * t
    setScaled(v: Vec2, t: number): this;

    // = v / t
    setScaledByInverse(v: Vec2, t: number): this;

    length2(): number;
    length(): number;

    normalize(): this;
    driection(): Vec2;

    setNormalized(v: Vec2): Vec2;

    dot(v: Vec2): number;
    dot(x: number, y: number): number;

    cross(v: Vec2): Vec2;
    cross(x: number, y: number): Vec2;

    setVectorProduct(a: Vec2, b: Vec2): this;

    xy01mul(m: Mat4): this;
    setxy01Transformed(v: Vec2, m: Mat4): this;

    xy00mul(m: Mat4): this;
    setxy00Transformed(v: Vec2, m: Mat4): this;

    commit(gl: WebGL2RenderingContext, uniformLocation: WebGLUniformLocation): void;

    static random(minVal: number|Vec2, maxVal: number|Vec2): Vec2;
}
