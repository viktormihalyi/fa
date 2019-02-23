"use strict";

const VEC_LENGTH = 3;

// TODO not all lines show up??

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
        const gl = this.gl;

        this.vertexCount = tree.length * 6;

        const array_len = this.vertexCount * 3;
        const vertexB = new Float32Array(array_len);
        const colorB = new Float32Array(array_len);

        colorB.fill(0);

        let iter = 0;

        for (let node of tree) {
            const dir = node.dir.times(VEC_LENGTH);
            const normal = node.normal.times(VEC_LENGTH);
            const binormal = normal.cross(dir).normalize().times(VEC_LENGTH);

            // red   - binormal
            // green - principal normal
            // blue  - tangent (dir)

            vertexB[iter++] = node.pos.x;
            vertexB[iter++] = node.pos.y;
            colorB[iter] = 1;
            vertexB[iter++] = node.pos.z;

            vertexB[iter++] = node.pos.x + dir.x;
            vertexB[iter++] = node.pos.y + dir.y;
            colorB[iter] = 1;
            vertexB[iter++] = node.pos.z + dir.z;

            vertexB[iter++] = node.pos.x;
            colorB[iter] = 1;
            vertexB[iter++] = node.pos.y;
            vertexB[iter++] = node.pos.z;

            vertexB[iter++] = node.pos.x + normal.x;
            colorB[iter] = 1;
            vertexB[iter++] = node.pos.y + normal.y;
            vertexB[iter++] = node.pos.z + normal.z;

            colorB[iter] = 1;
            vertexB[iter++] = node.pos.x;
            vertexB[iter++] = node.pos.y;
            vertexB[iter++] = node.pos.z;

            colorB[iter] = 1;
            vertexB[iter++] = node.pos.x + binormal.x;
            vertexB[iter++] = node.pos.y + binormal.y;
            vertexB[iter++] = node.pos.z + binormal.z;
        }
        assert(iter === array_len, 'bad buffer size');


        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexB, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorB, gl.STATIC_DRAW);

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


