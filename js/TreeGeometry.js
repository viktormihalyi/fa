"use strict";


// circle resolution
// each circle will be made of this many vertices
const CIRCLE_RES = 6;

const SKIP_CYLINDER_AT_BIFURCATION = false;

const CRICLE_STEP = 2*Math.PI/CIRCLE_RES;

// https://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space/73242#73242
// circle in 3d
// params:
//      - theta: angle from 0 to 2pi
//      - r: radius
//      - center: Vec3 center coordinate
//      - a, b: 2 Vec3s defining the plane of the circle
function circle(theta, r, center, a, b) {
    return    a.times(Math.cos(theta))
        .plus(b.times(Math.sin(theta)))
        .times(r)
        .plus(center);
}

class TreeGeometry {
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

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // element array buffer
        this.indexBuffer = gl.createBuffer();

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        const gl = this.gl;

        const array_len = tree.length * CIRCLE_RES * 3;

        const vertexBuf = new Float32Array(array_len);
        const normalBuf = new Float32Array(array_len);
        const uvBuf = new Float32Array(array_len/3*2);

        // console.log('vertices:', array_len/3);

        // iter for borth the vertex and normal buffer
        let iter = 0;

        // iter for uv buffer
        let iteruv = 0;

        this.node_to_circle_idx = new Array(tree.length);

        for (let i = 0; i < tree.length; i++){
            const node = tree[i];

            // let siblings = [];
            // if (node.parent !== null) {
            //     siblings = node.parent.children.filter(sibl => sibl !== node);
            // }
            // const is_bifurcation = siblings.length > 0;
            // if (SKIP_BIF && is_bifurcation) continue;

            this.node_to_circle_idx[i] = iter/3;

            for (let j = 0; j < CIRCLE_RES; j++) {
                const point_at_circle = circle(CRICLE_STEP*j, node.width, node.pos, node.binormal(), node.normal);
                const normal_vector = point_at_circle.minus(node.pos).normalize();
                const texture_coordinates = new Vec2(j/CIRCLE_RES, 0);

                uvBuf[iteruv++] = texture_coordinates.x;
                uvBuf[iteruv++] = texture_coordinates.y;

                // one vertex
                normalBuf[iter] = normal_vector.x;
                vertexBuf[iter++] = point_at_circle.x;

                normalBuf[iter] = normal_vector.y;
                vertexBuf[iter++] = point_at_circle.y;

                normalBuf[iter] = normal_vector.z;
                vertexBuf[iter++] = point_at_circle.z;
            }
        }
        assert(iter === array_len, 'vertex buffer bad size');


        const c = new Float32Array(array_len);
        c.fill(0);

        // // index vbo
        this.lineCount = 0;
        for (let node of tree) {
            if (SKIP_CYLINDER_AT_BIFURCATION) {
                if (node.children.length > 1) {
                    continue;
                }
            }
            this.lineCount += node.children.length * 6 * CIRCLE_RES;
        }

        // element array buffer uses 16 bit unsigned ints
        // so the tree.nodes size must be smaller than 2^16 = 65536
        assert(tree.length < 65536, 'dude stop');

        const indexBuffer = new Uint16Array(this.lineCount);
        // console.log('indexbuffer length:', this.lineCount);

        iter = 0;
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];

            if (SKIP_CYLINDER_AT_BIFURCATION) {
                if (node.children.length > 1) {
                    continue;
                }
            }


            for (let child of node.children) {
                const node_idx  = this.node_to_circle_idx[i];
                const child_idx = this.node_to_circle_idx[tree.indexOf(child)];

                if (node_idx === undefined || child_idx === undefined) {
                    continue;
                }
                for (let j = 0; j < CIRCLE_RES; j++) {
                    // triangle 1
                    indexBuffer[iter++] = child_idx + j;
                    indexBuffer[iter++] = node_idx  + j;
                    indexBuffer[iter++] = node_idx  + (j+1) % CIRCLE_RES;

                    // triangle 2
                    indexBuffer[iter++] = child_idx + j;
                    indexBuffer[iter++] = node_idx  + (j+1) % CIRCLE_RES;
                    indexBuffer[iter++] = child_idx + (j+1) % CIRCLE_RES;
                }
            }
        }
        assert(iter === this.lineCount, 'bad indexbuffer size');


        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBuf, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normalBuf, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvBuf, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, c, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);
    }

    draw(wireframe) {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        if (wireframe) {
            gl.drawElements(gl.LINES, this.lineCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawElements(gl.TRIANGLES, this.lineCount, gl.UNSIGNED_SHORT, 0);
        }
        gl.bindVertexArray(null);
    }
}


