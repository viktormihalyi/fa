Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in mat4 modelMatrix;

    uniform struct {
        mat4 viewProj;
        mat4 lightSpaceMatrix;
    } camera;

    out vec3 worldPos;
    out vec3 lightSpacePos;

    void main(void) {
        worldPos = (vec4(vertexPosition, 1) * modelMatrix).xyz;
        lightSpacePos = (vec4(worldPos, 1) * camera.lightSpaceMatrix).xyz;
        gl_Position = vec4(worldPos, 1) * camera.viewProj;
    }
`;