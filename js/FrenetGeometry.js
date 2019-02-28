"use strict";

const VEC_LENGTH = 3;

// TODO not all lines show up??

class FrenetGeometry {
    constructor(gl) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        const gl = this.gl;

        this.vertexCount = tree.length * 6;

        const vertexBuf = [];

        for (let node of tree) {
            const dir = node.dir.times(VEC_LENGTH);
            const normal = node.normal.times(VEC_LENGTH);
            const binormal = normal.cross(dir).normalize().times(VEC_LENGTH);

            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(dir));
            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(normal));
            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(binormal));
        }

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(gl.LINES, this.vertexBuffer, this.vertexCount);
        gl.bindVertexArray(null);
    }
}


