const VEC_LENGTH = 5;

const TANGENT_COLOR  = new Vec3(0, 0, 1); // blue
const NORMAL_COLOR   = new Vec3(1, 0, 0); // red
const BINORMAL_COLOR = new Vec3(0, 1, 0); // green

class FrenetGeometry {
    public gl: WebGL2RenderingContext;

    public vertexCount: number;
    public inputLayout: WebGLVertexArrayObject;
    public vertexBuffer: WebGLBuffer;
    public colorBuffer: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.vertexCount = 0;

        this.inputLayout = gl.createVertexArray()!;
        gl.bindVertexArray(this.inputLayout);

        this.vertexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        this.colorBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    }

    setPoints(tree: Tree): void {
        const gl = this.gl;

        const vertexBuf: Vec3[] = [];
        const colorBuf: Vec3[] = [];

        const add_frame = (pos: Vec3, tangent: Vec3, normal: Vec3, w: number) => {
            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(tangent.clone().normalize().times(VEC_LENGTH+w)));
            colorBuf.push(TANGENT_COLOR, TANGENT_COLOR);

            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(normal.clone().normalize().times(VEC_LENGTH+w)));
            colorBuf.push(NORMAL_COLOR, NORMAL_COLOR);

            vertexBuf.push(pos);
            vertexBuf.push(pos.plus(tangent.cross(normal).normalize().times(VEC_LENGTH+w)));
            colorBuf.push(BINORMAL_COLOR, BINORMAL_COLOR);
        }

        for (const node of tree.nodes) {
            assert(node.tangent !== undefined, 'wtf');
            add_frame(node.pos, node.tangent, node.normal, node.width);
        }

        this.vertexCount = vertexBuf.length;

        gl.bindVertexArray(this.inputLayout);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(vertexBuf), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vec3ArrayToFloat32Array(colorBuf), gl.STATIC_DRAW);
    }

    draw(): void {
        if (this.vertexCount === 0) {
            return;
        }
        const gl = this.gl;
        gl.bindVertexArray(this.inputLayout);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    }
}


