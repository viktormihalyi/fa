Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec4 vertexPosition;
    in vec2 vertexTexCoord;

    out vec2 uv;

    void main(void) {
        gl_Position = vertexPosition;
        uv = vertexTexCoord;
    }
`;