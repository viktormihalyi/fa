function getBezierPoints(bspoints, BN, BM, resolution, vertices, normals) {
    const bsurface = new BezierSurface(bspoints, BN, BM);

    const N = 1;
    const M = 1;

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            const u = i / N;
            const v = j / M;

            const next_u = (i+1) / N;
            const next_v = (j+1) / M;

            let p1 = bsurface.pointAt(u, v);
            let p2 = bsurface.pointAt(u, next_v);
            let p3 = bsurface.pointAt(next_u, v);
            let p4 = bsurface.pointAt(next_u, next_v);
            vertices.push(p1, p3, p2, p3, p4, p2);


            let np1 = bsurface.normalAt(u, v);
            let np2 = bsurface.normalAt(u, next_v);
            let np3 = bsurface.normalAt(next_u, v);
            let np4 = bsurface.normalAt(next_u, next_v);
            normals.push(np1, np3, np2, np3, np4, np2);
        }
    }
}

class BezierSurfaceGeometry {
    constructor(gl) {
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

        gl.bindVertexArray(null);

        this.vertexCount = 0;
    }

    setTree(tree) {

        console.log('recalculating bezier');
        const gl = this.gl;

        const f = [];
        const fn = [];

        getBezierPoints([
            new Vec3(0, 0, 0), new Vec3(0, 0, 10),
            new Vec3(0, 8, 0), new Vec3(0, 8, 10),
            new Vec3(8, 8, 0), new Vec3(8, 8, 10),
            new Vec3(8, 0, 0), new Vec3(5, 0, 10),
            new Vec3(0, 0, 0), new Vec3(0, 0, 10),
        ], 5, 2, 4, f, fn);


        for (const parent of tree.nodes) {
            const bifurcation = parent.children.length === 2;

            if (bifurcation) {
                const childA = parent.children[0];
                const childB = parent.children[1];
                const midpoint = parent.pos.plus(childA.pos).plus(childB.pos).over(3);


                const parent_circle_points = getCirclePointsForNode(parent);
                const childA_circle_points = getCirclePointsForNode(childA);
                const childB_circle_points = getCirclePointsForNode(childB);

                const childA_to_childB = childB.pos.minus(childA.pos).normalize();
                const childB_to_childA = childA.pos.minus(childB.pos).normalize();

                const midpoint_normal = midpoint.minus(parent.pos).cross(childA_to_childB);
                const midpoint_dir = childA_to_childB;


                // parents's normal and binormal so that they are the same across all bifurcations
                // http://www.euclideanspace.com/maths/geometry/elements/plane/lineOnPlane/
                const parent_tangent = parent.dir;
                const parent_normal = project_to_plane(childA_to_childB, parent_tangent).normalize();
                const parent_binormal = parent_tangent.cross(parent_normal).normalize();

                const childA_tangent = childA.dir;
                const childA_normal = project_to_plane(childA_to_childB, childA_tangent).normalize();
                const childA_binormal = childA_tangent.cross(childA_normal).normalize();

                const childB_tangent = childB.dir;
                const childB_normal = project_to_plane(childA_to_childB, childB_tangent).normalize();
                const childB_binormal = childB_tangent.cross(childB_normal).normalize();


                const p_parent_normal    = furthestPointInDirection(parent_circle_points, parent_normal);
                const p_parent_binormal  = furthestPointInDirection(parent_circle_points, parent_binormal);
                const p_parent_inormal   = furthestPointInDirection(parent_circle_points, parent_normal.times(-1));
                const p_parent_ibinormal = furthestPointInDirection(parent_circle_points, parent_binormal.times(-1));

                const p_childA_normal    = furthestPointInDirection(childA_circle_points, childA_normal);
                const p_childA_binormal  = furthestPointInDirection(childA_circle_points, childA_binormal);
                const p_childA_inormal   = furthestPointInDirection(childA_circle_points, childA_normal.times(-1));
                const p_childA_ibinormal = furthestPointInDirection(childA_circle_points, childA_binormal.times(-1));

                const p_childB_normal    = furthestPointInDirection(childB_circle_points, childB_normal);
                const p_childB_binormal  = furthestPointInDirection(childB_circle_points, childB_binormal);
                const p_childB_inormal   = furthestPointInDirection(childB_circle_points, childB_normal.times(-1));
                const p_childB_ibinormal = furthestPointInDirection(childB_circle_points, childB_binormal.times(-1));



                // parent to childb
                let parent_start_idx = parent_circle_points.indexOf(p_parent_binormal);
                let parent_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    parent_sel.push(parent_circle_points[(i+parent_start_idx)%CIRCLE_RES]);
                }

                let childB_start_idx = childB_circle_points.indexOf(p_childB_binormal);
                let childB_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    childB_sel.push(childB_circle_points[(i+childB_start_idx)%CIRCLE_RES]);
                }

                assert(parent_sel.length === childB_sel.length, 'should be same length');


                for (let i = 0; i < parent_sel.length - 1; i++) {
                    getBezierPoints([
                        childB_sel[i], childB_sel[i+1],
                        midpoint, midpoint,
                        parent_sel[i], parent_sel[i+1],
                    ], 3, 2, 1, f, fn);
                }

                // parent to childa
                parent_start_idx = parent_circle_points.indexOf(p_parent_ibinormal);
                parent_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    parent_sel.push(parent_circle_points[(i+parent_start_idx)%CIRCLE_RES]);
                }

                childB_start_idx = childA_circle_points.indexOf(p_childA_ibinormal);
                childB_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    childB_sel.push(childA_circle_points[(i+childB_start_idx)%CIRCLE_RES]);
                }

                assert(parent_sel.length === childB_sel.length, 'should be same length');

                for (let i = 0; i < parent_sel.length - 1; i++) {
                    getBezierPoints([
                        childB_sel[i], childB_sel[i+1],
                        midpoint, midpoint,
                        parent_sel[i], parent_sel[i+1],
                    ], 3, 2, 1, f, fn);
                }

                // between children
                parent_start_idx = childA_circle_points.indexOf(p_childA_binormal);
                parent_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    parent_sel.push(childA_circle_points[(i+parent_start_idx)%CIRCLE_RES]);
                }

                childB_start_idx = childB_circle_points.indexOf(p_childB_ibinormal);
                childB_sel = [];
                for (let i = 0; i <= CIRCLE_RES/2; i++) {
                    childB_sel.push(childB_circle_points[(i+childB_start_idx)%CIRCLE_RES]);
                }

                assert(parent_sel.length === childB_sel.length, 'should be same length');

                // wtf
                childB_sel.reverse();

                for (let i = 0; i < parent_sel.length - 1; i++) {
                    getBezierPoints([
                        parent_sel[i], parent_sel[i+1],
                        midpoint, midpoint,
                        childB_sel[i], childB_sel[i+1],
                    ], 3, 2, 4, f, fn);
                }
            }
        }

        this.vertexCount = f.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(f), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(fn), gl.STATIC_DRAW);
    }


    draw(debug) {
        if (this.vertexCount === 0) {
            console.log('not drawing');
            return;
        }

        const gl = this.gl;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        gl.drawArrays(gl.TRIANGLES, this.vertexBuffer, this.vertexCount);
        gl.bindVertexArray(null);
    }
}