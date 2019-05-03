// circle resolution
// each circle will be made of this many vertices
const CIRCLE_RES = 12;
const HALF_CIRCLE_RES = CIRCLE_RES / 2;

const SKIP_CYLINDER_AT_BIFURCATION = false;

const CRICLE_STEP = 2*Math.PI/CIRCLE_RES;

const INDEX_VERTICES = false;

// https://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space/73242#73242
// circle in 3d
// params:
//      - theta: angle from 0 to 2pi
//      - r: radius
//      - center: Vec3 center coordinate
//      - a, b: 2 Vec3s defining the plane of the circle
function parametric_circle_3d(theta: number, r: number, center: Vec3, a: Vec3, b: Vec3) {
    return    a.times(Math.cos(theta))
        .plus(b.times(Math.sin(theta)))
        .times(r)
        .plus(center);
}

function getCirclePoints(pos: Vec3, normal: Vec3, binormal: Vec3, width: number): Vec3[] {
    const points = [];
    for (let j = 0; j < CIRCLE_RES; j++) {
        points.push(parametric_circle_3d(CRICLE_STEP*j, width, pos, binormal, normal));
    }
    return points;
}

function getCirclePointsForNode(node: TreeNode): Vec3[] {
    return getCirclePoints(node.pos, node.normal, node.binormal(), node.width);
}

// cylinder res should be even, otherwise there is no opposite node, bla bla bla
function u_texcoord_for_cylinder(cylinder_resolution: number, t: number): number {
    const half_cylinder_res = cylinder_resolution/2;
    if (t < half_cylinder_res) {
        return t/half_cylinder_res;
    } else if (t == half_cylinder_res) {
        return 1;
    } else /* if (t > half_cylinder_res) */ {
        return (cylinder_resolution-t)/half_cylinder_res;
    }
}

function u_texcoords_for_cylinder(n: number): number[] {
    return new Array(n).fill(0).map((_, index) => u_texcoord_for_cylinder(n, index));
}


class TreeGeometry implements IGeometry {
    public gl: WebGL2RenderingContext;
    private vao: WebGLVertexArrayObject;
    private vertexBuffer: WebGLBuffer;
    private normalBuffer: WebGLBuffer;
    private textureCoordBuffer: WebGLBuffer;
    private tangents: WebGLBuffer;
    private bitangents: WebGLBuffer;
    private branchWidth: WebGLBuffer;
    private indexBuffer: WebGLBuffer;
    private index_count: number;
    private vertex_count: number;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.index_count = 0;
        this.vertex_count = 0;

        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.normalBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.textureCoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.tangents = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangents);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.bitangents = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangents);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.branchWidth = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.branchWidth);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // element array buffer
        this.indexBuffer = gl.createBuffer()!;

        gl.bindVertexArray(null);
    }

    setPoints(tree: Tree): void {
        assert(tree.nodes.length < 65536, 'too many nodes, cannot be indexed');

        const gl = this.gl;

        const raw_vertex_data = [];

        for (const node of tree.nodes) {
            for (const child of node.children) {
                // connect node to child
                const from = getCirclePointsForNode(node);
                const to  = getCirclePointsForNode(child);

                const texture_coordinates: number[] = u_texcoords_for_cylinder(CIRCLE_RES);

                for (let i = 0; i < CIRCLE_RES; i++) {
                    // triangle 1
                    // to   + i
                    // from + i
                    // from + (i+1) % CIRCLE_RES

                    // triangle 2
                    // to   + i
                    // from + (i+1) % CIRCLE_RES
                    // to   + (i+1) % CIRCLE_RES

                    const nextidx = (i+1) % CIRCLE_RES;

                    const u      = texture_coordinates[i];
                    const u_next = texture_coordinates[nextidx];

                    // triangle 1
                    raw_vertex_data.push(new VertexData(to  [i],       to [i]       .minus(child.pos).normalize(), new Vec2(u, child.depth), child.tangent, child.binormal()));
                    raw_vertex_data.push(new VertexData(from[i],       from[i]      .minus(node.pos).normalize(),  new Vec2(u, node.depth), node.tangent, node.binormal()));
                    raw_vertex_data.push(new VertexData(from[nextidx], from[nextidx].minus(node.pos).normalize(),  new Vec2(u_next, node.depth), node.tangent, node.binormal()));

                    // triangle 2
                    raw_vertex_data.push(new VertexData(to  [i],       to [i]       .minus(child.pos).normalize(), new Vec2(u, child.depth), child.tangent, child.binormal()));
                    raw_vertex_data.push(new VertexData(from[nextidx], from[nextidx].minus(node.pos).normalize(),  new Vec2(u_next, node.depth), node.tangent, node.binormal()));
                    raw_vertex_data.push(new VertexData(to  [nextidx], to [nextidx] .minus(child.pos).normalize(), new Vec2(u_next, child.depth), child.tangent, child.binormal()));
                }
            }
        }

        // ending circle
        for (const node of tree.nodes.filter(n => n.children.length === 0)) {
            const node_points = getCirclePointsForNode(node);
            const texture_coordinates: number[] = u_texcoords_for_cylinder(CIRCLE_RES);
            for (let i = 0; i < CIRCLE_RES; i++) {
                const nextidx = (i+1) % CIRCLE_RES;

                const u      = texture_coordinates[i];
                const u_next = texture_coordinates[nextidx];

                raw_vertex_data.push(new VertexData(node_points[i],       new Vec3(0, 1, 0), new Vec2(u,      node.depth), node.tangent, node.binormal()));
                raw_vertex_data.push(new VertexData(node.pos,             new Vec3(0, 1, 0), new Vec2(0.5,    node.depth+1), node.tangent, node.binormal()));
                raw_vertex_data.push(new VertexData(node_points[nextidx], new Vec3(0, 1, 0), new Vec2(u_next, node.depth), node.tangent, node.binormal()));
            }
        }

        let unique_vertices: VertexData[] = [];

        const index_buffer: number[] = [];
        if (INDEX_VERTICES) {
            const MAX_DIST_DIFF = 0.1;
            console.log(`CIRLCE_RES = ${CIRCLE_RES}`);
            console.log(`vertices count: ${raw_vertex_data.length}, running vertex indexer...`);

            // calculate distance here
            const tmp = new Vec3();

            // track progress
            let i = 0;
            let last_perc = -1;

            const index_start_time = new Date().getTime();
            // index vertices
            for (const vd of raw_vertex_data) {
                const done_percentage = Math.round(i++ / raw_vertex_data.length * 100);
                if (last_perc != done_percentage && done_percentage % 10 === 0) {
                    console.log(`${done_percentage}%`);
                    last_perc = done_percentage;
                }

                let is_new_vertex = true;

                for (let i = unique_vertices.length - 1; i >= 0; i--) {
                    if (tmp.setDifference(vd.position, unique_vertices[i].position).length2() < MAX_DIST_DIFF) {
                        index_buffer.push(i);
                        is_new_vertex = false;
                        break;
                    }
                }
                if (is_new_vertex) {
                    unique_vertices.push(vd);
                    index_buffer.push(unique_vertices.length-1);
                }
            }
            const index_end_time = new Date().getTime();
            console.log(`done (took ${index_end_time - index_start_time} ms), unique vertex count: ${unique_vertices.length}, index buffer size: ${index_buffer.length}`);

            this.index_count = index_buffer.length;
            console.log('normals, tangents, bitangents...');

            // average normals, find tangents and bitangents
            for (let i = 0; i < unique_vertices.length; i++) {
                // all triangles with the current vertex
                const triangleIndices: [number, number, number][] = [];
                // triangleIndices = [[vertex_idx1, vertex_idx2, vertex_idx3], ...]

                for (let j = 0; j < index_buffer.length; j++) {
                    if (index_buffer[j] === i) {
                        if (j % 3 === 0) {
                            triangleIndices.push([index_buffer[j+0], index_buffer[j+1], index_buffer[j+2]]);
                        } else if (j % 3 === 1) {
                            triangleIndices.push([index_buffer[j-1], index_buffer[j+0], index_buffer[j+1]]);
                        } else if (j % 3 === 2) {
                            triangleIndices.push([index_buffer[j-2], index_buffer[j-1], index_buffer[j+0]]);
                        }
                    }
                }

                const triangles = triangleIndices.map(t => [unique_vertices[t[0]], unique_vertices[t[1]], unique_vertices[t[2]]]);
                // triangles = [[vertex1, vertex2, vertex3], [vertex1, vertex2, vertex3], ...]

                // recalculate normals
                const avgNormal = new Vec3();
                for (const t of triangles) {
                    avgNormal.add(normalVectorForTriangle(t[0].position, t[1].position, t[2].position));
                }
                avgNormal.normalize();
                unique_vertices[i].normal = avgNormal;


                // calculate tangents, bitangents

                const avgTangent = new Vec3();
                const avgBitangent = new Vec3();

                for (const t_idx of triangleIndices) {
                    const v0 = unique_vertices[t_idx[0]].position;
                    const v1 = unique_vertices[t_idx[1]].position;
                    const v2 = unique_vertices[t_idx[2]].position;

                    const uv0 = unique_vertices[t_idx[0]].uv;
                    const uv1 = unique_vertices[t_idx[1]].uv;
                    const uv2 = unique_vertices[t_idx[2]].uv;

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

                unique_vertices[i].tangent = avgTangent;
                unique_vertices[i].bitangent = avgBitangent;
            }
            console.log('done');
        }

        if (!INDEX_VERTICES) {
            unique_vertices = raw_vertex_data;
            this.vertex_count = raw_vertex_data.length;
        }

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(unique_vertices.map(vd => vd.position)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(unique_vertices.map(vd => vd.normal)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec2ArrayToFloat32Array(unique_vertices.map(vd => vd.uv)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(unique_vertices.map(vd => vd.tangent)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangents);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(unique_vertices.map(vd => vd.bitangent)), gl.STATIC_DRAW);

        if (INDEX_VERTICES) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index_buffer), gl.STATIC_DRAW);
            this.index_count = index_buffer.length;
        }
    }

    public draw(): void {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);

        if (INDEX_VERTICES) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.index_count, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertex_count);
        }
    }
}


