Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;

    uniform struct {
        mat4 modelMatrix;
        mat4 viewProj;
    } camera;

    out vec4 worldPos;

    void main(void) {
        worldPos = vec4(vertexPosition, 1) * camera.modelMatrix;
        gl_Position = worldPos * camera.viewProj;
    }
`;