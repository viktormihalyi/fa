class SphereGeometry {
    public gl: WebGL2RenderingContext;
    public instanceCount: number;
    public vao: WebGLVertexArrayObject;
    public vertexBuffer: WebGLBuffer;
    public normalBuffer: WebGLBuffer;
    public texCoordBuffer: WebGLBuffer;
    public vertexCount: number;
    public modelmatrix: WebGLBuffer;


    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.instanceCount = 0;

        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

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


        const vec4size = 4*4;

        //  instanced model matrix
        this.modelmatrix = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelmatrix);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 4*vec4size, 0);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 4*vec4size, 1*vec4size);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 4*vec4size, 2*vec4size);
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 4*vec4size, 3*vec4size);

        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);
    }


    setModelMatrices(listOfMatrices: Mat4[]) {
        const gl = this.gl;

        this.instanceCount = listOfMatrices.length;

        const mat4size = 4*4*4;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelmatrix);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceCount * mat4size), gl.STATIC_DRAW);

        for (let i = 0; i < listOfMatrices.length; i++) {
            const m = listOfMatrices[i];
            gl.bufferSubData(gl.ARRAY_BUFFER, i*mat4size, m.storage);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw() {
        if (this.vertexCount === 0 || this.instanceCount === 0) {
            return;
        }

        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, this.vertexCount, this.instanceCount);
    }
}