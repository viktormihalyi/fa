"use strict";


// circle resolution
// each circle will be made of this many vertices
const CIRCLE_RES = 8;

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

function getCirclePointsForNode(node) {
    const points = [];
    for (let j = 0; j < CIRCLE_RES; j++) {
        points.push(circle(CRICLE_STEP*j, node.width, node.pos, node.binormal(), node.normal));
    }
    return points;
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

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // element array buffer
        this.indexBuffer = gl.createBuffer();

        gl.bindVertexArray(null);
    }

    setPoints(tree) {
        const gl = this.gl;

        // set v coordinates for textures
        function recursive_set_v(root, n) {
            root.v = n;
            for (const child of root.children) {
                recursive_set_v(child, (n + 1) % 2);
            }
        }
        recursive_set_v(tree[0], 0);


        const vertexBuf = [];
        const normalBuf = [];
        const uvBuf = [];

        this.node_to_circle_idx = new Array(tree.length);

        assert(CIRCLE_RES % 2 === 0, 'odd circle_res');

        const HALF_CIRCLE_RES = CIRCLE_RES / 2;
        for (let i = 0; i < tree.length; i++){
            const node = tree[i];

            this.node_to_circle_idx[i] = vertexBuf.length;

            const circle_points = getCirclePointsForNode(node);
            for (let j = 0; j < CIRCLE_RES; j++) {
                const normal_vector = circle_points[j].minus(node.pos).normalize();
                const texture_coordinates = new Vec2((HALF_CIRCLE_RES-j%HALF_CIRCLE_RES)/HALF_CIRCLE_RES, node.v);

                vertexBuf.push(circle_points[j]);
                normalBuf.push(normal_vector);
                uvBuf.push(texture_coordinates);
            }
        }

        // index vbo
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
        assert(tree.length < 65536, 'too many nodes');

        const indexBuf = [];

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
                    indexBuf.push(child_idx + j);
                    indexBuf.push(node_idx  + j);
                    indexBuf.push(node_idx  + (j+1) % CIRCLE_RES);

                    // triangle 2
                    indexBuf.push(child_idx + j);
                    indexBuf.push(node_idx  + (j+1) % CIRCLE_RES);
                    indexBuf.push(child_idx + (j+1) % CIRCLE_RES);
                }
            }
        }

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(normalBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec2ArrayToFloat32Array(uvBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuf), gl.STATIC_DRAW);

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


