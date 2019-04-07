"use strict";

const VEC_LENGTH = 5;

const TANGENT_COLOR  = new Vec3(0, 0, 1); // blue
const NORMAL_COLOR   = new Vec3(1, 0, 0); // red
const BINORMAL_COLOR = new Vec3(0, 1, 0); // green

class FrenetGeometry {
    constructor(gl) {
        this.gl = gl;

        this.vertexCount = 0;

        this.inputLayout = gl.createVertexArray();
        gl.bindVertexArray(this.inputLayout);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    }

    setPoints(tree) {
        const gl = this.gl;

        const vertexBuf = [];
        const colorBuf = [];

        const add_frame = (pos, tangent, normal) => {
            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(tangent.clone().normalize().times(VEC_LENGTH)));
            colorBuf.push(TANGENT_COLOR, TANGENT_COLOR);

            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(normal.clone().normalize().times(VEC_LENGTH)));
            colorBuf.push(NORMAL_COLOR, NORMAL_COLOR);

            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(tangent.cross(normal).normalize().times(VEC_LENGTH)));
            colorBuf.push(BINORMAL_COLOR, BINORMAL_COLOR);
        }

        for (const node of tree.nodes) {
            add_frame(node.pos, node.dir, node.normal);
        }

        this.vertexCount = vertexBuf.length;

        gl.bindVertexArray(this.inputLayout);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(colorBuf), gl.STATIC_DRAW);
    }

    draw() {
        if (this.vertexCount === 0) {
            return;
        }
        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    }
}


