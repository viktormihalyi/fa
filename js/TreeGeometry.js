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

        const roots = tree.filter((n, i) => i == 0 && n.parent === null)
        for (const root of roots) {
            recursive_set_v(root, 0);
        }


        const vertexBuf = [];
        const normalBuf = [];
        const uvBuf = [];

        const node_to_circle_idx = new Array(tree.length*2);

        assert(CIRCLE_RES % 2 === 0, 'odd circle_res');

        const toconnect = [];

        const HALF_CIRCLE_RES = CIRCLE_RES / 2;
        for (let i = 0; i < tree.length; i++){
            const node = tree[i];

            node_to_circle_idx[i] = vertexBuf.length;

            const circle_points = getCirclePointsForNode(node);
            for (let j = 0; j < CIRCLE_RES; j++) {
                const normal_vector = circle_points[j].minus(node.pos).normalize();
                const texture_coordinates = new Vec2(
                    node.v,
                    (HALF_CIRCLE_RES-j%HALF_CIRCLE_RES)/HALF_CIRCLE_RES,
                );

                if (false && node.children.length === 0) vertexBuf.push(circle_points[0]);
                else vertexBuf.push(circle_points[j]);
                normalBuf.push(normal_vector);
                uvBuf.push(texture_coordinates);
            }
        }

        for (const node of tree) {
            for (const child of node.children) {
                toconnect.push({
                    from: node_to_circle_idx[tree.indexOf(node)],
                    to:   node_to_circle_idx[tree.indexOf(child)]
                });
            }
        }

        const step = 1/25;

        console.log(vertexBuf.length);
        if (false) for (const node of tree) {
            if (node.children.length === 2) {
                const childA = node.children[0];
                const childB = node.children[1];

                if (!(childA.children.length > 0 && childB.children.length > 0)) continue;
                // assert(childA.children.length > 0 && childB.children.length > 0, 'no children');

                const midpoint = node.pos.times(1).plus(childA.pos).plus(childB.pos).over(3);
                const mid_dir = midpoint.minus(node.pos);//childA.pos.minus(childB.pos).normalize();
                const a_to_b_dir = childB.pos.minus(childA.pos).normalize();
                const b_to_a_dir = childA.pos.minus(childB.pos).normalize();
                const mid_normal = mid_dir.cross(midpoint.minus(node.pos));

                // a to mid
                {
                    const points = [];

                    let prev_node = childA.children[0];
                    let prev_normal = childA.normal.times(-1);
                    for (let t = 0; t <= 1; t += step) {
                        const interpolated_pos = catmull_rom_spline(prev_node.pos, childA.pos, midpoint, childB.pos, t);
                        const interpolated_dir = catmull_rom_spline(prev_node.dir.times(-1), childA.dir.times(-1), a_to_b_dir, childB.dir, t);
                        // const interpolated_pos = lerpVec3(childA.pos, midpoint, t);
                        // const interpolated_dir = lerpVec3(childA.dir.times(-1), a_to_b_dir, t);
                        const interpolated_normal = Tree.grow_rmf_normal_raw(interpolated_pos, interpolated_dir, prev_normal, interpolated_dir);

                        points.push(new TreeNode(null, interpolated_pos, interpolated_dir, lerp(childA.width, childB.width, t), interpolated_normal));
                        prev_normal = interpolated_normal;
                    }

                    let prev_idk = node_to_circle_idx[tree.indexOf(childA)];
                    for (const inode of points) {
                        const circle_points = getCirclePointsForNode(inode);
                        toconnect.push({from: vertexBuf.length, to: prev_idk});

                        for (let j = 0; j < CIRCLE_RES; j++) {
                            const normal_vector = circle_points[j].minus(inode.pos).normalize();
                            const texture_coordinates = new Vec2((HALF_CIRCLE_RES-j%HALF_CIRCLE_RES)/HALF_CIRCLE_RES, node.v);

                            vertexBuf.push(circle_points[j]);
                            normalBuf.push(normal_vector);
                            uvBuf.push(texture_coordinates);
                        }
                        prev_idk = vertexBuf.length-CIRCLE_RES;
                    }
                }
                // b to mid
                {
                    const points = [];

                    let prev_node = childB.children[0];
                    let prev_normal = childB.normal.times(-1);
                    for (let t = 0; t <= 1; t += step) {
                        const interpolated_pos = catmull_rom_spline(prev_node.pos, childB.pos, midpoint, childA.pos, t);
                        const interpolated_dir = catmull_rom_spline(prev_node.dir.times(-1), childB.dir.times(-1), b_to_a_dir, childA.dir, t);
                        const interpolated_normal = Tree.grow_rmf_normal_raw(interpolated_pos, interpolated_dir, prev_normal, interpolated_dir);

                        points.push(new TreeNode(null, interpolated_pos, interpolated_dir, lerp(childB.width, childA.width, t), interpolated_normal));
                        prev_normal = interpolated_normal;
                    }

                    let prev_idk = node_to_circle_idx[tree.indexOf(childB)];
                    for (const inode of points) {
                        const circle_points = getCirclePointsForNode(inode);
                        toconnect.push({from: vertexBuf.length, to: prev_idk});

                        for (let j = 0; j < CIRCLE_RES; j++) {
                            const normal_vector = circle_points[j].minus(inode.pos).normalize();
                            const texture_coordinates = new Vec2((HALF_CIRCLE_RES-j%HALF_CIRCLE_RES)/HALF_CIRCLE_RES, node.v);

                            vertexBuf.push(circle_points[j]);
                            normalBuf.push(normal_vector);
                            uvBuf.push(texture_coordinates);
                        }
                        prev_idk = vertexBuf.length-CIRCLE_RES;
                    }
                }
            }
        }

        if (false)
        for (const node of tree) {
            if (node.children.length === 2) {
                const childA = node.children[0];
                const childB = node.children[1];

                if (!(childA.children.length > 0 && childB.children.length > 0)) continue;
                // assert(childA.children.length > 0 && childB.children.length > 0, 'no children');

                const midpoint = node.pos.plus(childA.pos.times(2)).plus(childB.pos.times(2)).over(5);
                const mid_dir = midpoint.minus(node.pos);//childA.pos.minus(childB.pos).normalize();
                const a_to_b_dir = childB.pos.minus(childA.pos).normalize();
                const b_to_a_dir = childA.pos.minus(childB.pos).normalize();
                // const mid_normal = mid_dir.cross(midpoint.minus(node.pos));
                let mid_normal;

                const frames = [];

                // a to mid
                {
                    const points = [];
                    for (let t = 0; t <= 1; t += step) {
                        const interpolated_pos = catmull_rom_spline(childA.children[0].pos, childA.pos, midpoint, childB.pos, t);
                        points.push(interpolated_pos);
                    }
                    const points_and_dirs = [];
                    let prev_pos = childA.pos;
                    for (let i = 0; i < points.length; i++) {
                        points_and_dirs.push({
                            pos: points[i],
                            dir: points[i].minus(prev_pos).normalize(),
                        });
                        prev_pos = points[i];
                    }

                    const points_and_dirs_and_normals = [];
                    let last_normal = childA.normal.times(-1);
                    for (let i = 0; i < points_and_dirs.length-1; i++) {
                        const n = Tree.grow_rmf_normal_raw(points_and_dirs[i].pos, points_and_dirs[i].dir, last_normal, points_and_dirs[i+1].pos.minus(points_and_dirs[i].pos));
                        points_and_dirs_and_normals.push({
                            pos: points_and_dirs[i].pos,
                            dir: points_and_dirs[i].dir,
                            normal: n,
                        });
                        last_normal = n;
                    }
                    mid_normal = last_normal.clone();
                    // points_and_dirs_and_normals.forEach((n, i) => {if (i > -1) add_frame(n.pos, n.dir, n.normal)});
                    frames.push(...points_and_dirs_and_normals);
                }

                // mid to b
                {
                    const points = [];
                    for (let t = 0; t <= 1; t += step) {
                        const interpolated_pos = catmull_rom_spline(childA.pos, midpoint, childB.pos, childB.children[0].pos, t);
                        points.push(interpolated_pos);
                    }
                    const points_and_dirs = [];
                    let prev_pos = midpoint;
                    for (let i = 0; i < points.length; i++) {
                        points_and_dirs.push({
                            pos: points[i],
                            dir: points[i].minus(prev_pos).normalize(),
                        });
                        prev_pos = points[i];
                    }

                    const points_and_dirs_and_normals = [];
                    let last_normal = mid_normal;
                    for (let i = 0; i < points_and_dirs.length-1; i++) {
                        const n = Tree.grow_rmf_normal_raw(points_and_dirs[i].pos, points_and_dirs[i].dir, last_normal, points_and_dirs[i+1].pos.minus(points_and_dirs[i].pos));
                        points_and_dirs_and_normals.push({
                            pos: points_and_dirs[i].pos,
                            dir: points_and_dirs[i].dir,
                            normal: n,
                        });
                        last_normal = n;
                    }

                    // points_and_dirs_and_normals.forEach((n, i) => {if (i > -1) add_frame(n.pos, n.dir, n.normal)});
                    frames.push(...points_and_dirs_and_normals);
                }

                const newNodes = frames.map(f => new TreeNode(null, f.pos, f.dir, childA.width, f.normal));

                let prev_idk = node_to_circle_idx[tree.indexOf(childA)];
                for (const no of newNodes) {
                    const circle_points = getCirclePointsForNode(no);

                    toconnect.push({from: vertexBuf.length, to: prev_idk});

                    for (let j = 0; j < CIRCLE_RES; j++) {
                        const normal_vector = circle_points[j].minus(no.pos).normalize();
                        const texture_coordinates = new Vec2((HALF_CIRCLE_RES-j%HALF_CIRCLE_RES)/HALF_CIRCLE_RES, node.v);

                        vertexBuf.push(circle_points[j]);
                        normalBuf.push(normal_vector);
                        uvBuf.push(texture_coordinates);
                    }
                    prev_idk = vertexBuf.length-CIRCLE_RES;
                }

            }
        }




        // // index vbo
        // this.lineCount = 0;
        // for (let node of tree) {
        //     if (SKIP_CYLINDER_AT_BIFURCATION) {
        //         if (node.children.length > 1) {
        //             continue;
        //         }
        //     }
        //     this.lineCount += node.children.length * 6 * CIRCLE_RES;
        // }


        // element array buffer uses 16 bit unsigned ints
        // so the tree.nodes size must be smaller than 2^16 = 65536
        assert(tree.length < 65536, 'too many nodes');

        const indexBuf = [];

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

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(normalBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec2ArrayToFloat32Array(uvBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuf), gl.STATIC_DRAW);


        const tangentVectors = [];
        const bitangentVectors = [];


        // for (let i = 0; i < vertexBuf.length; i += 3) {
        //     const v0 = vertexBuf[(i+0) % (vertexBuf.length-1)];
        //     const v1 = vertexBuf[(i+1) % (vertexBuf.length-1)];
        //     const v2 = vertexBuf[(i+2) % (vertexBuf.length-1)];

        //     const uv0 = uvBuf[(i+0) % (uvBuf.length-1)];
        //     const uv1 = uvBuf[(i+1) % (uvBuf.length-1)];
        //     const uv2 = uvBuf[(i+2) % (uvBuf.length-1)];

        //     const edge1 = v1.minus(v0);
        //     const edge2 = v2.minus(v0);

        //     const deltaUV1 = uv1.minus(uv0);
        //     const deltaUV2 = uv2.minus(uv0);

        //     const r = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);
        //     const tangent   = (edge1.times(deltaUV2.y).minus(edge2.times(deltaUV1.y))).times(r).normalize();
        //     const bitangent = (edge2.times(deltaUV1.x).minus(edge1.times(deltaUV2.x))).times(r).normalize();

        //     tangentVectors.push(tangent, tangent, tangent);

        //     bitangentVectors.push(bitangent, bitangent, bitangent);
        // }


        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(tangentVectors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(bitangentVectors), gl.STATIC_DRAW);
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


