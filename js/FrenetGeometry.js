"use strict";

const VEC_LENGTH = 3;

class FrenetGeometry {
    constructor(gl) {
        this.connection_count = 0;

        this.gl = gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        console.log(`FrenetGeometry#setPoints(${tree.length})`);
        const gl = this.gl;

        this.lineCount = tree.length * 3;

        const array_len = this.lineCount * 6;
        const vertexBuffer = new Float32Array(array_len);
        const colorBuffer = new Float32Array(array_len);

        colorBuffer.fill(0);

        let iter = 0;

        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];

            const dir = node.dir.times(VEC_LENGTH);
            const normal = node.normal.times(VEC_LENGTH);
            const binormal = normal.cross(dir).normalize().times(VEC_LENGTH);

            // red   - binormal
            // green - principal normal
            // blue  - tangent (dir)

            vertexBuffer[iter++] = node.pos.x;
            vertexBuffer[iter++] = node.pos.y;
            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.z;

            vertexBuffer[iter++] = node.pos.x + dir.x;
            vertexBuffer[iter++] = node.pos.y + dir.y;
            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.z + dir.z;

            vertexBuffer[iter++] = node.pos.x;
            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.y;
            vertexBuffer[iter++] = node.pos.z;

            vertexBuffer[iter++] = node.pos.x + normal.x;
            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.y + normal.y;
            vertexBuffer[iter++] = node.pos.z + normal.z;

            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.x;
            vertexBuffer[iter++] = node.pos.y;
            vertexBuffer[iter++] = node.pos.z;

            colorBuffer[iter] = 1;
            vertexBuffer[iter++] = node.pos.x + binormal.x;
            vertexBuffer[iter++] = node.pos.y + binormal.y;
            vertexBuffer[iter++] = node.pos.z + binormal.z;
        }
        assert(iter === array_len, 'bad buffer size');

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorBuffer, gl.DYNAMIC_DRAW);

    }

    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawArrays(gl.LINES, this.vertexBuffer, this.lineCount)
    }
}


