Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexColor;

    uniform struct {
        mat4 viewProj;
    } camera;

    out vec3 color;

    void main(void) {
        gl_Position = vec4(vertexPosition, 1) * camera.viewProj;
        color = vertexColor;
    }
`;