"use strict";
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
        console.log('updating points');
        const gl = this.gl;

        const debug = false;

        // https://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space/73242#73242
        const circle = (theta, r, center, a, b) => new Vec3(
            Math.cos(theta)*a.x + Math.sin(theta)*b.x,
            Math.cos(theta)*a.y + Math.sin(theta)*b.y,
            Math.cos(theta)*a.z + Math.sin(theta)*b.z,
        ).times(r).add(center);

        // circle resolution
        // each circle will be made of this many vertices
        const circ = 4;

        // number of vertices generated for each node
        const o = debug ? 18 : 6;

        // first node doesnt have a parent
        this.connection_count = tree.length * circ;

        const array_len = this.connection_count * 3;

        const vertexBuf = new Float32Array(array_len);


        console.log('tree lengt', tree.length);
        console.log('conn count', this.connection_count);
        console.log('allocating', array_len);

        let lc = 0;

        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];

            const binormal = node.normal.cross(node.dir).normalize();

            if (!debug) {
                const step = 2*Math.PI/circ;

                for (let j = 0; j < circ; j++) {
                    const p1 = circle(step*j, node.width, node.pos, binormal, node.normal);

                    vertexBuf[lc++] = p1.x;
                    vertexBuf[lc++] = p1.y;
                    vertexBuf[lc++] = p1.z;
                }

            } else {
                vertexBuf[i*o+0] = node.pos.x;
                vertexBuf[i*o+1] = node.pos.y;
                vertexBuf[i*o+2] = node.pos.z;
                // c[i*o+0] = 1;

                vertexBuf[i*o+3] = node.pos.x + node.dir.x;
                vertexBuf[i*o+4] = node.pos.y + node.dir.y;
                vertexBuf[i*o+5] = node.pos.z + node.dir.z;
                // c[i*o+3] = 1;

                vertexBuf[i*o+6] = node.pos.x;
                vertexBuf[i*o+7] = node.pos.y;
                vertexBuf[i*o+8] = node.pos.z;
                c[i*o+7] = 1;

                vertexBuf[i*o+9] = node.pos.x + node.normal.x;
                vertexBuf[i*o+10] = node.pos.y + node.normal.y;
                vertexBuf[i*o+11] = node.pos.z + node.normal.z;
                c[i*o+10] = 1;

                vertexBuf[i*o+12] = node.pos.x;
                vertexBuf[i*o+13] = node.pos.y;
                vertexBuf[i*o+14] = node.pos.z;
                c[i*o+12] = 1;

                vertexBuf[i*o+15] = node.pos.x + binormal.x;
                vertexBuf[i*o+16] = node.pos.y + binormal.y;
                vertexBuf[i*o+17] = node.pos.z + binormal.z;
                c[i*o+15] = 1;
            }

        }
        console.log(lc);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBuf, gl.DYNAMIC_DRAW);

        const c = new Float32Array(array_len);
        c.fill(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, c, gl.DYNAMIC_DRAW);

        // // index vbo
        this.lineCount = 0;
        for (let node of tree) {
            this.lineCount += node.children.length * 6 * circ;
        }
        const indexBuffer = new Uint16Array(this.lineCount);

        lc = 0;
        for (let node of tree) {
            for (let child of node.children) {
                const node_idx = tree.indexOf(node);
                const child_idx = tree.indexOf(child);

                if (child_idx > 65536) {
                    console.error('awt');
                }

                for (let i = 0; i < circ; i++) {
                    indexBuffer[lc++] = child_idx * circ + i;
                    indexBuffer[lc++] = node_idx  * circ + i;
                    indexBuffer[lc++] = node_idx  * circ + (i+1) % circ;

                    indexBuffer[lc++] = child_idx * circ + i;
                    indexBuffer[lc++] = node_idx  * circ + (i+1) % circ;
                    indexBuffer[lc++] = child_idx * circ + (i+1) % circ;
                }
            }
        }
        console.log(this.lineCount, lc);

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
        // gl.drawArrays(gl.LINES, this.vertexBuffer, this.connection_count);
    }
}


