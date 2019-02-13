"use strict";
class TriangleGeometryInstanced {
    constructor(gl) {
        this.gl = gl;

        // allocate and fill vertex buffer in device memory (OpenGL name: array buffer)
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, .01, 0,
            -.01, 0, 0,
            .01, 0, 0
        ]), gl.STATIC_DRAW);

        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ]), gl.STATIC_DRAW);

        this.vertexTexCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1,
            0, 0,
            1, 1
        ]), gl.STATIC_DRAW);

        this.offsetBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);


        const buff = new Float32Array(10000*3);
        buff.fill(0, 0, 10000*3);

        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                buff[(i+100*j)*3+0] = i/100-0.5;
                buff[(i+100*j)*3+1] = -j/100+0.5;
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, buff, gl.STATIC_DRAW);

        // allocate and fill index buffer in device memory (OpenGL name: element array buffer)
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 2
        ]), gl.STATIC_DRAW);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(3, 1);

        // set index buffer to pipeline input
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindVertexArray(null);
    }

    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElementsInstanced(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0, 10000);
    }
}


