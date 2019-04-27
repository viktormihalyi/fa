Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec4 vertexPosition;
    in vec2 vertexTexCoord;
    in mat4 instanceModelMatrix;

    uniform struct {
        mat4 lightSpaceMatrix;
        mat4 modelMatrix;
    } camera;

    out vec2 uv;

    void main(void) {
        uv = vertexTexCoord;
        gl_Position = vertexPosition
            * instanceModelMatrix
            * camera.modelMatrix
            * camera.lightSpaceMatrix;
    }
`;