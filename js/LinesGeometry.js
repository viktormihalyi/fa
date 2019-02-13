"use strict";
class LinesGeometry {
    constructor(gl) {
        this.lineCount = 0;

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

        // element array buffer
        // this.indexBuffer = gl.createBuffer();

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        console.log('updating points');
        const gl = this.gl;

        // vertex vbo
        const o = 18;
        this.lineCount = (tree.length - 1) * o / 3;
        this.lineCount *= 4;
        const f = new Float32Array(this.lineCount * o);
        const c = new Float32Array(this.lineCount * o);
        c.fill(0);
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.parent !== null) {

                // f[i*o+0] = node.pos.x;
                // f[i*o+1] = node.pos.y;
                // f[i*o+2] = node.pos.z;

                // f[i*o+3] = node.parent.pos.x;
                // f[i*o+4] = node.parent.pos.y;
                // f[i*o+5] = node.parent.pos.z;

                f[i*o+0] = node.pos.x;
                f[i*o+1] = node.pos.y;
                f[i*o+2] = node.pos.z;
                // c[i*o+0] = 1;

                f[i*o+3] = node.pos.x + node.dir.x;
                f[i*o+4] = node.pos.y + node.dir.y;
                f[i*o+5] = node.pos.z + node.dir.z;
                // c[i*o+3] = 1;

                f[i*o+6] = node.pos.x;
                f[i*o+7] = node.pos.y;
                f[i*o+8] = node.pos.z;
                c[i*o+7] = 1;

                f[i*o+9] = node.pos.x + node.normal.x;
                f[i*o+10] = node.pos.y + node.normal.y;
                f[i*o+11] = node.pos.z + node.normal.z;
                c[i*o+10] = 1;

                const binormal = node.dir.cross(node.normal);
                f[i*o+12] = node.pos.x;
                f[i*o+13] = node.pos.y;
                f[i*o+14] = node.pos.z;
                c[i*o+12] = 1;

                f[i*o+15] = node.pos.x + binormal.x;
                f[i*o+16] = node.pos.y + binormal.y;
                f[i*o+17] = node.pos.z + binormal.z;
                c[i*o+15] = 1;

            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, c, gl.DYNAMIC_DRAW);

        // // index vbo
        // this.lineCount = tree.length - 1;
        // const indexBuffer = new Uint16Array(this.lineCount * 2);

        // let lc = 0;
        // for (let node of tree) {
        //     for (let child of node.children) {
        //         indexBuffer[lc++] = tree.indexOf(node);
        //         indexBuffer[lc++] = tree.indexOf(child);
        //     }
        // }

        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.DYNAMIC_DRAW);
    }

    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
        gl.drawArrays(gl.LINES, this.vertexBuffer, this.lineCount);
    }
}


