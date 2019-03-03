Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;
    in mat4 modelM;

    uniform struct {
        mat4 viewProj;
    } camera;

    uniform mat4 model;

    out vec2 uv;
    out vec3 normal;

    void main(void) {
        gl_Position = vec4(vertexPosition, 1) * modelM * camera.viewProj;
        uv = vertexTexCoord;
        normal = (vec4(vertexNormal, 0) * modelM).xyz;
    }
`;