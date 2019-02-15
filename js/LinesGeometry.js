"use strict";


// circle resolution
// each circle will be made of this many vertices
const CIRCLE_RES = 8;

const CRICLE_STEP = 2*Math.PI/CIRCLE_RES;

// https://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space/73242#73242
function circle(theta, r, center, a, b) {
    return new Vec3(
        Math.cos(theta)*a.x + Math.sin(theta)*b.x,
        Math.cos(theta)*a.y + Math.sin(theta)*b.y,
        Math.cos(theta)*a.z + Math.sin(theta)*b.z,
    ).times(r).add(center);
}

class LinesGeometry {
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

        // element array buffer
        this.indexBuffer = gl.createBuffer();

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        const gl = this.gl;

        console.log(`LinesGeometry#setPoints(${tree.length})`);

        const array_len = tree.length * CIRCLE_RES * 3;
        const vertexBuf = new Float32Array(array_len);

        console.log('vertices:', array_len/3);

        let iter = 0;

        for (let node of tree) {
            for (let j = 0; j < CIRCLE_RES; j++) {
                const point_at_circle = circle(CRICLE_STEP*j, node.width, node.pos, node.binormal(), node.normal);

                vertexBuf[iter++] = point_at_circle.x;
                vertexBuf[iter++] = point_at_circle.y;
                vertexBuf[iter++] = point_at_circle.z;
            }
        }
        assert(iter === array_len, 'vertex buffer bad size');


        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBuf, gl.DYNAMIC_DRAW);

        const c = new Float32Array(array_len);
        c.fill(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, c, gl.DYNAMIC_DRAW);

        // // index vbo
        this.lineCount = 0;
        for (let node of tree) {
            this.lineCount += node.children.length * 6 * CIRCLE_RES;
        }

        // has to be indexable with 16 bits (uint16)
        assert(tree.length < 65536);

        const indexBuffer = new Uint16Array(this.lineCount);
        console.log('indexbuffer length:', this.lineCount);

        iter = 0;
        for (let node of tree) {
            for (let child of node.children) {
                const node_idx = tree.indexOf(node);
                const child_idx = tree.indexOf(child);

                if (child_idx > 65536) {
                    console.error('awt');
                }

                for (let i = 0; i < CIRCLE_RES; i++) {
                    indexBuffer[iter++] = child_idx * CIRCLE_RES + i;
                    indexBuffer[iter++] = node_idx  * CIRCLE_RES + i;
                    indexBuffer[iter++] = node_idx  * CIRCLE_RES + (i+1) % CIRCLE_RES;

                    indexBuffer[iter++] = child_idx * CIRCLE_RES + i;
                    indexBuffer[iter++] = node_idx  * CIRCLE_RES + (i+1) % CIRCLE_RES;
                    indexBuffer[iter++] = child_idx * CIRCLE_RES + (i+1) % CIRCLE_RES;
                }
            }
        }
        assert(iter === this.lineCount, 'bad indexbuffer size');

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.DYNAMIC_DRAW);
    }

    draw(wireframe) {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        if (wireframe) {
            gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawElements(gl.TRIANGLES, this.lineCount, gl.UNSIGNED_SHORT, 0);
        }
    }
}


