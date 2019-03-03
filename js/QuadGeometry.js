"use strict";
class QuadGeometry {
    constructor(gl) {
        this.gl = gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0,
            -1,  1, 0,
             1, -1, 0,
             1,  1, 0,
        ]), gl.STATIC_DRAW);

        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]), gl.STATIC_DRAW);

        this.vertexTexCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ]), gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 2,
            1, 2, 3,
        ]), gl.STATIC_DRAW);

        this.inputLayout = gl.createVertexArray();
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        const vec4size = 4*4;

        //  instanced model matrix
        this.modelMatrices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrices);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 4*vec4size, 0);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 4*vec4size, 1*vec4size);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 4*vec4size, 2*vec4size);
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 4*vec4size, 3*vec4size);

        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindVertexArray(null);
    }

    setModelMatrices(modelMatrices) {
        console.log(`leaves instances: ${modelMatrices.length}`);
        const gl = this.gl;

        this.instanceCount = modelMatrices.length;

        const mat4size = 4*4*4;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceCount * mat4size), gl.STATIC_DRAW);

        for (let i = 0; i < modelMatrices.length; i++) {
            const m = modelMatrices[i];
            gl.bufferSubData(gl.ARRAY_BUFFER, i*mat4size, m.storage);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

    }

    draw() {
        if (this.instanceCount === 0) {
            return;
        }

        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, this.instanceCount);
    }
}


