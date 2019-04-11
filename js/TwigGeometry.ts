class TwigGeometry implements IGeometry {
    public gl: WebGL2RenderingContext;

    public inputLayout: WebGLVertexArrayObject;
    public vertexBuffer: WebGLBuffer;
    public normalBuffer: WebGLBuffer;

    public vertexCount: number;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.inputLayout = gl.createVertexArray()!;
        gl.bindVertexArray(this.inputLayout);

        this.vertexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        this.normalBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        const raw_vertex_data = [];

        const from_pos = new Vec3(0, 0, 0);
        const to_pos   = new Vec3(0, 100, 0);
        const from = getCirclePoints(from_pos, new Vec3(1, 0, 0), new Vec3(0, 0, 1), 2);
        const to   = getCirclePoints(to_pos,   new Vec3(1, 0, 0), new Vec3(0, 0, 1), 0.5);

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

            // triangle 1
            raw_vertex_data.push(new VertexData(to  [i],       to [i]       .minus(to_pos).normalize()));
            raw_vertex_data.push(new VertexData(from[i],       from[i]      .minus(from_pos).normalize()));
            raw_vertex_data.push(new VertexData(from[nextidx], from[nextidx].minus(from_pos).normalize()));

            // triangle 2
            raw_vertex_data.push(new VertexData(to  [i],       to [i]       .minus(to_pos).normalize()));
            raw_vertex_data.push(new VertexData(from[nextidx], from[nextidx].minus(from_pos).normalize()));
            raw_vertex_data.push(new VertexData(to  [nextidx], to [nextidx] .minus(to_pos).normalize()));
        }

        for (let i = 0; i < CIRCLE_RES; i++) {
            const nextidx = (i+1) % CIRCLE_RES;
            // triangle 1
            raw_vertex_data.push(new VertexData(to[i], new Vec3(0, 1, 0)));
            raw_vertex_data.push(new VertexData(to_pos, new Vec3(0, 1, 0)));
            raw_vertex_data.push(new VertexData(to[nextidx], new Vec3(0, 1, 0)));
        }

        this.vertexCount = raw_vertex_data.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(raw_vertex_data.map(vd => vd.position)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(raw_vertex_data.map(vd => vd.normal)), gl.STATIC_DRAW);

    }

    draw(): void {
        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}