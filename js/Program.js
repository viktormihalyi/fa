"use strict";
class Program {
    constructor(gl, vertexShader, fragmentShader) {
        this.gl = gl;
        this.sourceFileNames = { vs: vertexShader.sourceFileName, fs: fragmentShader.sourceFileName };
        this.glProgram = gl.createProgram();
        gl.attachShader(this.glProgram, vertexShader.glShader);
        gl.attachShader(this.glProgram, fragmentShader.glShader);

        gl.bindAttribLocation(this.glProgram, 0, 'vertexPosition');
        gl.bindAttribLocation(this.glProgram, 1, 'vertexNormal');
        gl.bindAttribLocation(this.glProgram, 2, 'vertexTexCoord');
        gl.bindAttribLocation(this.glProgram, 3, 'vertexOffset');

        gl.linkProgram(this.glProgram);
        if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            throw new Error('Could not link shaders [vertex shader:' + vertexShader.sourceFileName + ']:[fragment shader: ' + fragmentShader.sourceFileName + ']\n' + gl.getProgramInfoLog(this.glProgram));
        }
    }
    commit() {
        this.gl.useProgram(this.glProgram);
    }
}


