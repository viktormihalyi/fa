interface IAttribLocation {
    name: string;
    position: number;
}

class Program {
    public static from(gl: WebGL2RenderingContext, vertexShaderFile: string,
                       fragmentShaderFile: string, attribLocations: IAttribLocation[]) {

        return new Program(gl,
            new Shader(gl, gl.VERTEX_SHADER, vertexShaderFile),
            new Shader(gl, gl.FRAGMENT_SHADER, fragmentShaderFile),
            attribLocations
        );
    }
    public gl: WebGL2RenderingContext;
    public glProgram: WebGLProgram;

    constructor(gl: WebGL2RenderingContext,
                vertexShader: Shader, fragmentShader: Shader, attribLocations: IAttribLocation[]) {

        this.gl = gl;
        this.glProgram = gl.createProgram()!;
        gl.attachShader(this.glProgram, vertexShader.glShader);
        gl.attachShader(this.glProgram, fragmentShader.glShader);

        for (const attrib of attribLocations) {
            gl.bindAttribLocation(this.glProgram, attrib.position, attrib.name);
        }

        gl.linkProgram(this.glProgram);
        if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            throw new Error(`Could not link shaders [vertex shader:${vertexShader.sourceFileName}]:[fragment shader: ${fragmentShader.sourceFileName}]\n${gl.getProgramInfoLog(this.glProgram)}`);
        }
    }

    public commit() {
        this.gl.useProgram(this.glProgram);
    }
}
