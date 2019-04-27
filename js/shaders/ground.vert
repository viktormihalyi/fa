Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec3 vertexPosition;

    uniform struct {
        mat4 modelMatrix;
        mat4 viewProj;
        mat4 lightSpaceMatrix;
    } camera;

    out vec4 worldPos;
    out vec3 lightSpacePos;

    void main(void) {
        worldPos = vec4(vertexPosition, 1) * camera.modelMatrix;
        lightSpacePos = (worldPos * camera.lightSpaceMatrix).xyz;
        gl_Position = worldPos * camera.viewProj;

    }
`;