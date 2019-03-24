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

        for (const node of treeNodes) {
            add_frame(node.pos, node.dir, node.normal);
        }

        const step = 1/15;

        if (false)
        for (const node of treeNodes) {
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
                    points_and_dirs_and_normals.forEach((n, i) => {if (i > -1) add_frame(n.pos, n.dir, n.normal)});
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

                    points_and_dirs_and_normals.forEach((n, i) => {if (i > -1) add_frame(n.pos, n.dir, n.normal)});
                }
            }
        }

        this.vertexCount = vertexBuf.length;

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


