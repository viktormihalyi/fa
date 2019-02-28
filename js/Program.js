"use strict";
class Program {
    constructor(gl, vertexShader, fragmentShader, attribLocations) {
        this.gl = gl;
        this.sourceFileNames = { vs: vertexShader.sourceFileName, fs: fragmentShader.sourceFileName };
        this.glProgram = gl.createProgram();
        gl.attachShader(this.glProgram, vertexShader.glShader);
        gl.attachShader(this.glProgram, fragmentShader.glShader);

        for (const attrib of attribLocations) {
            gl.bindAttribLocation(this.glProgram, attrib.position, attrib.name);
            gl.bindAttribLocation(this.glProgram, 2, 'vertexNormal');
            gl.bindAttribLocation(this.glProgram, 3, 'vertexTexCoord');
        }

        gl.linkProgram(this.glProgram);
        if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            throw new Error('Could not link shaders [vertex shader:' + vertexShader.sourceFileName + ']:[fragment shader: ' + fragmentShader.sourceFileName + ']\n' + gl.getProgramInfoLog(this.glProgram));
        }
    }
    commit() {
        this.gl.useProgram(this.glProgram);
    }
}


