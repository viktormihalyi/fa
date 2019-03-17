"use strict";

const VEC_LENGTH = 3;

const TANGENT_COLOR  = new Vec3(0, 0, 1); // blue
const NORMAL_COLOR   = new Vec3(1, 0, 0); // red
const BINORMAL_COLOR = new Vec3(0, 1, 0); // green

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

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);

        this.vertexCount = 0;
    }

    setPoints(treeNodes) {
        const gl = this.gl;

        this.vertexCount = treeNodes.length * 6;

        const vertexBuf = [];
        const colorBuf = [];


        for (const node of treeNodes) {
            const dir = node.dir.times(VEC_LENGTH);
            let normal = node.normal.times(VEC_LENGTH);
            let binormal = node.binormal().times(VEC_LENGTH);

            if (node.children.length === 2) {
                const childA_to_childB = node.children[0].pos.minus(node.children[1].pos).normalize();
                normal = project_to_plane(childA_to_childB, node.dir).normalize().times(VEC_LENGTH);
                binormal = node.dir.cross(normal).normalize().times(VEC_LENGTH);
            }

            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(dir));
            colorBuf.push(TANGENT_COLOR, TANGENT_COLOR);

            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(normal));
            colorBuf.push(NORMAL_COLOR, NORMAL_COLOR);

            vertexBuf.push(node.pos);
            vertexBuf.push(node.pos.plus(binormal));
            colorBuf.push(BINORMAL_COLOR, BINORMAL_COLOR);
        }

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(colorBuf), gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    draw() {
        if (this.vertexCount === 0) {
            return;
        }

        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(gl.LINES, this.vertexBuffer, this.vertexCount);
        gl.bindVertexArray(null);
    }
}


