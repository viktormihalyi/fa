Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec4 vertexPosition;
    in mat4 modelM;

    uniform struct {
        mat4 modelMatrix;
        mat4 lightSpaceMatrix;
    } camera;

    void main(void) {
        gl_Position = vertexPosition
            * camera.modelMatrix
            * camera.lightSpaceMatrix;
    }
`;