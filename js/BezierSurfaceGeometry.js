function addVec3ToFloat32Array(float32Array, vec3, index) {
    float32Array[index + 0] = vec3.storage[0];
    float32Array[index + 1] = vec3.storage[1];
    float32Array[index + 2] = vec3.storage[2];
}


function getBezierPoints(bsurface, BN, BM, resolution, vertices, normals) {
    const N = BN * resolution;
    const M = BM * resolution;

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


        // generate BN * BM array of points

        const BN = 8;
        const BM = 8;
        let points = [];
        for (let i = 0; i < BN; i++) {
            for (let j = 0; j < BM; j++) {
                let y = Math.random()*250;
                points.push(new Vec3(i*25, y, j*25));
            }
        }
        let bsurface = new BezierSurface(points, BN, BM);


        const resulution = 2;

        const N = BN * resulution;
        const M = BM * resulution;

        const f = new Float32Array(N*M*6*3);
        const fn = new Float32Array(N*M*6*3);
        fn.fill(1);

        let iter = 0;
        let niter = 0;


        this.vertexCount = N*M*6;

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

                addVec3ToFloat32Array(f, p1, iter);
                iter += 3;
                addVec3ToFloat32Array(f, p3, iter);
                iter += 3;
                addVec3ToFloat32Array(f, p2, iter);
                iter += 3;
                addVec3ToFloat32Array(f, p3, iter);
                iter += 3;
                addVec3ToFloat32Array(f, p4, iter);
                iter += 3;
                addVec3ToFloat32Array(f, p2, iter);
                iter += 3;


                let np1 = bsurface.normalAt(u, v);
                let np2 = bsurface.normalAt(u, next_v);
                let np3 = bsurface.normalAt(next_u, v);
                let np4 = bsurface.normalAt(next_u, next_v);

                addVec3ToFloat32Array(fn, np1, niter);
                niter += 3;
                addVec3ToFloat32Array(fn, np3, niter);
                niter += 3;
                addVec3ToFloat32Array(fn, np2, niter);
                niter += 3;
                addVec3ToFloat32Array(fn, np3, niter);
                niter += 3;
                addVec3ToFloat32Array(fn, np4, niter);
                niter += 3;
                addVec3ToFloat32Array(fn, np2, niter);
                niter += 3;
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fn, gl.STATIC_DRAW);
    }

    setTree(tree) {
        console.log('recalculating bezier');
        const gl = this.gl;

        const f = [];
        const fn = [];

        for (const node of tree.nodes) {
            const bifurcation = node.children.length > 1;
            if (bifurcation) {
                console.log('bif!');
                const child1 = node.children[0];
                const child2 = node.children[1];

                const how = 2;

                const child1points = [];
                const child2points = [];
                for (let j = 0; j < CIRCLE_RES; j++) {
                    child1points.push(circle(CRICLE_STEP*j, child1.width, child1.pos, child1.binormal(), child1.normal));
                    child2points.push(circle(CRICLE_STEP*j, child2.width, child2.pos, child2.binormal(), child2.normal));
                }

                let combinations = [];
                child1points.forEach(p1 => {
                    child2points.forEach(p2 => {
                        combinations.push({
                            p1: p1,
                            p2: p2,
                            distance: p1.minus(p2).length(),
                        });
                    });
                });

                // first point is the closest to each other
                combinations.sort((a, b) => a.distance - b.distance);
                const closestCombos = [];
                while (closestCombos.length < how) {
                    const cc = combinations[0];
                    closestCombos.push(cc);
                    combinations = combinations.filter(combo => combo.p1 !== cc.p1 && combo.p2 !== cc.p2);
                }

                const closestPoints = closestCombos.flatMap(c => [c.p1, c.p2]);

                console.log(closestPoints);

                const BN = how;
                const BM = 2;

                let bsurface = new BezierSurface(closestPoints, BN, BM);


                const vertices = [];
                const normals = [];
                getBezierPoints(bsurface, BN, BM, 1, vertices, normals);
                vertices.forEach(v => f.push(v));
                normals.forEach(n => fn.push(n));

            }
        }

        this.vertexCount = f.length;
        console.log(f);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        console.log(`buffering ${f.length} vertices`);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(f), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(fn), gl.STATIC_DRAW);
    }


    draw() {
        const gl = this.gl;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        gl.drawArrays(gl.TRIANGLES, this.vertexBuffer, this.vertexCount);
        gl.bindVertexArray(null);
    }
}