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

        const debug = false;

        // https://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space/73242#73242
        const circle = (theta, r, center, a, b) => new Vec3(
            Math.cos(theta)*a.x + Math.sin(theta)*b.x,
            Math.cos(theta)*a.y + Math.sin(theta)*b.y,
            Math.cos(theta)*a.z + Math.sin(theta)*b.z,
        ).times(r).add(center);

        const circ = 6;
        const o = debug ? 18 : 6;
        this.lineCount = (tree.length - 1) * o / 3;
        this.lineCount *= debug ? 4 : 1*circ;

        const f = new Float32Array(this.lineCount * o);
        const c = new Float32Array(this.lineCount * o);
        let lc = 0;
        c.fill(0);
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.parent !== null) {
                const binormal = node.normal.cross(node.dir).normalize();

                if (!debug) {
                    for (let t = 0; t < 2*Math.PI; t += Math.PI/circ) {
                        const p1 = circle(t,              node.width, node.pos, binormal, node.normal);
                        const p2 = circle(t+Math.PI/circ, node.width, node.pos, binormal, node.normal);

                        f[lc++] = p1.x;
                        f[lc++] = p1.y;
                        f[lc++] = p1.z;

                        f[lc++] = p2.x;
                        f[lc++] = p2.y;
                        f[lc++] = p2.z;
                    }

                } else {
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


