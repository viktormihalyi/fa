class SphereGeometry {
    public gl: WebGL2RenderingContext;
    public inputLayout: WebGLVertexArrayObject;
    public vertexBuffer: WebGLBuffer;
    public normalBuffer: WebGLBuffer;
    public texCoordBuffer: WebGLBuffer;
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

        this.texCoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);

        const sphere_parametric = (u: number, v: number) => {
            const theta = u * 2*Math.PI;
            const phi = v * Math.PI;
            return new Vec3(
                1 * Math.cos(theta) * Math.sin(phi),
                1 * Math.sin(theta) * Math.sin(phi),
                1 * Math.cos(phi)
            );
        };


        const sphere_vertex_data = (u: number, v: number) => {
            const pos = sphere_parametric(u, v);
            return new VertexData(pos, pos, new Vec2(u, v));
        };


        const step = 1/6;
        const vertrexDataArray = [];
        for (let n = 0; n < 1; n += step) {
            for (let m = 0; m < 1; m += step) {
                vertrexDataArray.push(sphere_vertex_data(n, m));
                vertrexDataArray.push(sphere_vertex_data(n+step, m));
                vertrexDataArray.push(sphere_vertex_data(n, m+step));

                vertrexDataArray.push(sphere_vertex_data(n+step, m));
                vertrexDataArray.push(sphere_vertex_data(n+step, m+step));
                vertrexDataArray.push(sphere_vertex_data(n, m+step));
            }
        }

        const vertices = vertrexDataArray.map(vd => vd.position);
        const uvs = vertrexDataArray.map(vd => vd.uv);
        const normals = vertrexDataArray.map(vd => vd.normal);

        this.vertexCount = vertices.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec2ArrayToFloat32Array(uvs), gl.STATIC_DRAW);
    }

    draw() {
        if (this.vertexCount === 0) {
            return;
        }

        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}