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

        this.vertexBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer2);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // element array buffer
        this.indexBuffer = gl.createBuffer();
        this.indexBuffer2 = gl.createBuffer();

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        console.log('updating points');
        const gl = this.gl;

        // vertex vbo
        this.lineCount = tree.length - 1;
        const f = new Float32Array(this.lineCount * 6);
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].parent !== null) {
                f[i*6+0] = tree[i].pos.x;
                f[i*6+1] = tree[i].pos.y;
                f[i*6+2] = tree[i].pos.z;
                f[i*6+3] = tree[i].parent.pos.x;
                f[i*6+4] = tree[i].parent.pos.y;
                f[i*6+5] = tree[i].parent.pos.z;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW);

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


