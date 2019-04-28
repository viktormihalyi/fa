declare class Mat4 {
    storage: Float32Array;

    constructor();

    constructor(m: Mat4);

    constructor(
        m00: number, m01: number, m02: number, m03: number,
        m10: number, m11: number, m12: number, m13: number,
        m20: number, m21: number, m22: number, m23: number,
        m30: number, m31: number, m32: number, m33: number);

    set(): this;
    set(m: Mat4): this;
    set(m00: number, m01: number, m02: number, m03: number,
        m10: number, m11: number, m12: number, m13: number,
        m20: number, m21: number, m22: number, m23: number,
        m30: number, m31: number, m32: number, m33: number): this;

    premul(m: Mat4): this;
    mul(m: Mat4): this;

    scale(u: Vec3 | number): this;
    scale(u: number, v: number, s: number): this;
    scale(t: number): this;

    rotate(angle: number, u?: Vec3): this;
    rotate(angle: number, u?: number, v?: number, s?: number): this;

    translate(u: Vec3): this;
    translate(u: number, v: number, s: number): this;

    transpose(): this;

    invert(): this;

    commit(gl: WebGL2RenderingContext, uniformLocation: WebGLUniformLocation): void;
}