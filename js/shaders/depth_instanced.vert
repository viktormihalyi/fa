Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec4 vertexPosition;
    in mat4 modelMatrix;

    uniform struct {
        mat4 lightSpaceMatrix;
    } camera;

    void main(void) {
        gl_Position = vertexPosition
            * modelMatrix
            * camera.lightSpaceMatrix;
    }
`;