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

function getCirclePoints(pos, normal, binormal, width) {
    const points = [];
    for (let j = 0; j < CIRCLE_RES; j++) {
        points.push(circle(CRICLE_STEP*j, width, pos, binormal, normal));
    }
    return points;
}

function getCirclePointsForNode(node) {
    return getCirclePoints(node.pos, node.normal, node.binormal(), node.width);
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

        this.tangents = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangents);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.bitangents = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangents);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.branchWidth = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.branchWidth);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 0, 0);
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
                recursive_set_v(child, (n + 1) % 20000);
            }
        }


        const roots = tree.nodes.filter((n, i) => n.parent === null)
        for (const root of roots) {
            recursive_set_v(root, 0);
        }


        const widths = [];
        const vertexBuf = [];
        const normalBuf = [];
        const uvBuf = [];

        const node_to_circle_idx = new Array(tree.nodes.length*2);

        assert(CIRCLE_RES % 2 === 0, 'odd circle_res');

        const toends = [];
        const toconnect = [];

        const HALF_CIRCLE_RES = CIRCLE_RES / 2;
        for (let i = 0; i < tree.nodes.length; i++){
            const node = tree.nodes[i];

            node_to_circle_idx[i] = vertexBuf.length;

            const circle_points = getCirclePointsForNode(node);
            for (let j = 0; j < CIRCLE_RES; j++) {
                const normal_vector = circle_points[j].minus(node.pos).normalize();

                let u;
                if (j < HALF_CIRCLE_RES) {
                    u = j/HALF_CIRCLE_RES;
                } else {
                    u = 1-(j-HALF_CIRCLE_RES)/HALF_CIRCLE_RES;
                }
                const texture_coordinates = new Vec2(u, node.v);

                vertexBuf.push(circle_points[j]);
                widths.push(node.width);
                normalBuf.push(normal_vector);
                uvBuf.push(texture_coordinates);
            }

            if (node.children.length === 0) {
                toends.push({mid: vertexBuf.length, c: node_to_circle_idx[i]});
                vertexBuf.push(node.pos);
                uvBuf.push(new Vec2(0, 0));
                widths.push(node.width);
                normalBuf.push(node.dir);
            }
        }


        for (const node of tree.nodes) {
            if (SKIP_CYLINDER_AT_BIFURCATION) {
                if (node.children.length > 1) {
                    continue;
                }
            }
            for (const child of node.children) {
                toconnect.push({
                    from: node_to_circle_idx[tree.nodes.indexOf(node)],
                    to:   node_to_circle_idx[tree.nodes.indexOf(child)]
                });
            }
        }

        assert(vertexBuf.length === widths.length, 'wtf');

        // element array buffer uses 16 bit unsigned ints
        // so the tree.nodes size must be smaller than 2^16 = 65536
        assert(tree.nodes.length < 65536, 'too many nodes');

        const indexBuf = [];

        for (const e of toends) {
            const mid_i = e.mid;
            const c_i = e.c;
            for (let j = 0; j < CIRCLE_RES; j++) {
                // triangle 1
                indexBuf.push(mid_i);
                indexBuf.push(c_i + j);
                indexBuf.push(c_i + (j+1) % CIRCLE_RES);
            }
        }

        for (const spline of toconnect) {
            assert(spline.from+CIRCLE_RES-1 < vertexBuf.length, 'ok');
            assert(spline.to+CIRCLE_RES-1 < vertexBuf.length, 'ok');

            for (let j = 0; j < CIRCLE_RES; j++) {
                // triangle 1
                indexBuf.push(spline.to   + j);
                indexBuf.push(spline.from + j);
                indexBuf.push(spline.from + (j+1) % CIRCLE_RES);

                // triangle 2
                indexBuf.push(spline.to   + j);
                indexBuf.push(spline.from + (j+1) % CIRCLE_RES);
                indexBuf.push(spline.to   + (j+1) % CIRCLE_RES);
            }
        }
        this.lineCount = indexBuf.length;


        const tangentVectors = [];
        const bitangentVectors = [];

        for (let i = 0; i < vertexBuf.length; i++) {

            // all triangles with the current vertex
            const triangleIndices = [];
            // triangleIndices = [[vertex_idx1, vertex_idx2, vertex_idx3], ...]

            for (let j = 0; j < indexBuf.length; j++) {
                if (indexBuf[j] === i) {
                    if (j % 3 === 0) {
                        triangleIndices.push([indexBuf[j+0], indexBuf[j+1], indexBuf[j+2]]);
                    } else if (j % 3 === 1) {
                        triangleIndices.push([indexBuf[j-1], indexBuf[j+0], indexBuf[j+1]]);
                    } else if (j % 3 === 2) {
                        triangleIndices.push([indexBuf[j-2], indexBuf[j-1], indexBuf[j+0]]);
                    }
                }
            }

            const triangles = triangleIndices.map(t => [vertexBuf[t[0]], vertexBuf[t[1]], vertexBuf[t[2]]]);
            // triangles = [[vertex1, vertex2, vertex3], [vertex1, vertex2, vertex3], ...]

            // recalculate normals
            const avgNormal = new Vec3();
            for (const t of triangles) {
                avgNormal.add(normalVectorForTriangle(t[0], t[1], t[2]));
            }
            avgNormal.normalize();
            normalBuf[i] = avgNormal;


            // calculate tangents, bitangents

            const avgTangent = new Vec3();
            const avgBitangent = new Vec3();

            for (const t_idx of triangleIndices) {
                const v0 = vertexBuf[t_idx[0]];
                const v1 = vertexBuf[t_idx[1]];
                const v2 = vertexBuf[t_idx[2]];

                const uv0 = uvBuf[t_idx[0]];
                const uv1 = uvBuf[t_idx[1]];
                const uv2 = uvBuf[t_idx[2]];

                const edge1 = v1.minus(v0);
                const edge2 = v2.minus(v0);

                const deltaUV1 = uv1.minus(uv0);
                const deltaUV2 = uv2.minus(uv0);

                const r = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);
                const tangent   = (edge1.times(deltaUV2.y).minus(edge2.times(deltaUV1.y))).times(r).normalize();
                const bitangent = (edge2.times(deltaUV1.x).minus(edge1.times(deltaUV2.x))).times(r).normalize();

                avgTangent.add(tangent);
                avgBitangent.add(bitangent);
            }
            avgTangent.normalize();
            avgBitangent.normalize();

            tangentVectors.push(avgTangent);
            bitangentVectors.push(avgBitangent);
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


        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(tangentVectors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(bitangentVectors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.branchWidth);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(widths), gl.STATIC_DRAW);
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


