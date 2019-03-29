"use strict";
class Material {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        return UniformReflection.addProperties(this.gl, this.program.glProgram, this);
    }

    commit() {
        this.program.commit();
        UniformReflection.commitProperties(this.gl, this.program.glProgram, this);
    }
}