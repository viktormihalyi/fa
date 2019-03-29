"use strict";
class InstancedGeometry {
    constructor(gl, geometry, start_modelm_vertex_attrib, usesIndexArray) {
        assert(geometry.vertexCount !== undefined, 'no vertexCount on geometry');
        assert(geometry.inputLayout !== undefined, 'no inputLayout on geometry');
        assert(geometry.indexBuffer !== undefined, 'no indexBuffer on geometry');

        this.gl = gl;
        this.geometry = geometry;
        this.instanceCount = 0;
        this.usesIndexArray = usesIndexArray;


        //  instanced model matrix
        gl.bindVertexArray(this.geometry.inputLayout);

        this.modelMatrix = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrix);

        const vec4size = 4*4;
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

        gl.bindVertexArray(this.geometry.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelMatrix);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceCount * mat4size), gl.STATIC_DRAW);

        for (let i = 0; i < listOfMatrices.length; i++) {
            const m = listOfMatrices[i];
            gl.bufferSubData(gl.ARRAY_BUFFER, i*mat4size, m.storage);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw() {
        if (this.geometry.vertexCount === 0 || this.instanceCount === 0) {
            return;
        }

        const gl = this.gl;
        gl.bindVertexArray(this.geometry.inputLayout);
        if (this.usesIndexArray) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometry.indexBuffer);
            gl.drawElementsInstanced(gl.TRIANGLES, this.geometry.vertexCount, gl.UNSIGNED_SHORT, 0, this.instanceCount);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        } else {
            // ???
            gl.drawArraysInstanced(gl.TRIANGLES, 0, this.geometry.vertexCount, this.instanceCount);
        }
    }
}