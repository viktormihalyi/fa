Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;

    uniform struct {
        mat4 viewProj;
    } camera;

    out vec3 color;
    out vec3 normal;
    out vec2 uv;

    void main(void) {
        gl_Position = vec4(vertexPosition, 1) * camera.viewProj;
        normal = vertexNormal;
        uv = vertexTexCoord;
    }
`;