"use strict";
class Material {
    public gl: WebGL2RenderingContext;
    public program: any;
    [s: string]: any;

    constructor(gl: WebGL2RenderingContext, program: Program) {
        this.gl = gl;
        this.program = program;
        return UniformReflection.addProperties(this.gl, this.program.glProgram, this);
    }

    public commit(): void {
        this.program.commit();
        UniformReflection.commitProperties(this.gl, this.program.glProgram, this);
    }
}