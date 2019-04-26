class QuadGeometry implements IGeometry {
    public gl: WebGL2RenderingContext;

    private vertexBuffer: WebGLBuffer;
    private vertexNormalBuffer: WebGLBuffer;
    private vertexTexCoordBuffer: WebGLBuffer;

    public indexBuffer: WebGLBuffer;
    public inputLayout: WebGLVertexArrayObject;
    public vertexCount: number;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.vertexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0,
            -1,  1, 0,
             1, -1, 0,
             1,  1, 0,
        ]), gl.STATIC_DRAW);

        this.vertexNormalBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]), gl.STATIC_DRAW);

        this.vertexTexCoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ]), gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 2,
            1, 2, 3,
        ]), gl.STATIC_DRAW);
        this.vertexCount = 6;

        this.inputLayout = gl.createVertexArray()!;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    }

    draw(): void {
        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
}


