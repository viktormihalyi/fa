"use strict";
class InstancedGeometry {
    constructor(gl, geometry, start_modelm_vertex_attrib) {
        assert(geometry.vertexCount !== undefined, 'no vertexcount on geometry');
        assert(geometry.inputLayout !== undefined, 'no inputLayout on geometry');

        this.gl = gl;
        this.geometry = geometry;
        this.instanceCount = 0;

        const vec4size = 4*4;

        //  instanced model matrix
        this.modelMatrix = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrix);

        const start_idx = start_modelm_vertex_attrib;
        gl.enableVertexAttribArray(start_idx+0);
        gl.vertexAttribPointer(start_idx+0, 4, gl.FLOAT, false, 4*vec4size, 0*vec4size);
        gl.enableVertexAttribArray(start_idx+1);
        gl.vertexAttribPointer(start_idx+1, 4, gl.FLOAT, false, 4*vec4size, 1*vec4size);
        gl.enableVertexAttribArray(start_idx+2);
        gl.vertexAttribPointer(start_idx+2, 4, gl.FLOAT, false, 4*vec4size, 2*vec4size);
        gl.enableVertexAttribArray(start_idx+3);
        gl.vertexAttribPointer(start_idx+3, 4, gl.FLOAT, false, 4*vec4size, 3*vec4size);

        gl.vertexAttribDivisor(start_idx+0, 1);
        gl.vertexAttribDivisor(start_idx+1, 1);
        gl.vertexAttribDivisor(start_idx+2, 1);
        gl.vertexAttribDivisor(start_idx+3, 1);
    }

    setModelMatrices(listOfMatrices) {
        const gl = this.gl;

        this.instanceCount = listOfMatrices.length;

        const mat4size = 4*4*4;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrix);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceCount * mat4size), gl.STATIC_DRAW);

        for (let i = 0; i < listOfMatrices.length; i++) {
            const m = listOfMatrices[i];
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
        gl.drawArraysInstanced(gl.TRIANGLES, this.geometry.vertexBuffer, this.geometry.vertexCount, this.instanceCount);
    }
}