Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;
    in mat4 instanceModelMatrix;

    uniform struct {
        mat4 lightSpaceMatrix;
        mat4 modelMatrix;
        vec3 wLiPos;
        vec3 wEye;
        mat4 viewProj;
    } camera;


    out vec2 uv;
    out vec3 normal;
    out vec3 lightSpacePos;

    out vec3 wLight;
    out vec3 wView;
    out vec3 wEye;
    out vec3 worldPos;
    out vec3 modelPos;
    out mat3 TBN;

    void main(void) {
        modelPos = (vec4(vertexPosition, 1) * instanceModelMatrix).xyz;
        vec4 wPos = vec4(vertexPosition, 1) * instanceModelMatrix * camera.modelMatrix;

        uv = vertexTexCoord;
        normal   = (vec4(vertexNormal, 0) * instanceModelMatrix).xyz;
        wLight   = (camera.wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = (camera.wEye * wPos.w - wPos.xyz);
        lightSpacePos = (wPos * camera.lightSpaceMatrix).xyz;
        worldPos = wPos.xyz;

        gl_Position = wPos * camera.viewProj;
    }
`;