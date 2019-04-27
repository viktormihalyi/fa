Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec4 vertexPosition;
    in mat4 modelM;

    uniform struct {
        mat4 modelMatrix;
        mat4 lightSpaceMatrix;
    } trafo;

    void main(void) {
        gl_Position = vertexPosition
            * trafo.modelMatrix
            * trafo.lightSpaceMatrix;
    }
`;