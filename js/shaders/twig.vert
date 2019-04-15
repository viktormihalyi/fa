Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in mat4 modelMatrix;

    uniform struct {
        mat4 viewProj;
    } camera;

    out vec3 worldPos;

    void main(void) {
        worldPos = (vec4(vertexPosition, 1) * modelMatrix).xyz;
        gl_Position = vec4(worldPos, 1) * camera.viewProj;
    }
`;