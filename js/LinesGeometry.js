"use strict";
class LinesGeometry {
    constructor(gl) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -0.9, -0.9, 0, // bottom left
            -0.9,  0.9, 0, // bottom right
             0.9, -0.9, 0, // top left
             0.9,  0.9, 0, // top right
        ]), gl.STATIC_DRAW);


        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // element array buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1,
            1, 2,
            2, 3,
            3, 0,
        ]), gl.STATIC_DRAW);

        this.lineCount = 4;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindVertexArray(null);
    }

    setPoints(gl, tree) {
        // vertex vbo
        const f = new Float32Array(tree.length * 3);
        for (let i = 0; i < tree.length; i++) {
            f[i*3+0] = tree[i].pos.x;
            f[i*3+1] = tree[i].pos.y;
            f[i*3+2] = tree[i].pos.z;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW);

        // index vbo
        this.lineCount = tree.length - 1;
        const indexBuffer = new Uint16Array(this.lineCount * 2);

        let lc = 0;
        for (let node of tree) {
            for (let child of node.children) {
                indexBuffer[lc++] = tree.indexOf(node);
                indexBuffer[lc++] = tree.indexOf(child);
            }
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.DYNAMIC_DRAW);
    }

    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.drawElements(gl.LINES, this.lineCount*2, gl.UNSIGNED_SHORT, 0);
    }
}


