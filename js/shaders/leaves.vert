Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;
    in mat4 modelM;

    uniform struct {
        mat4 lightSpaceMatrix;
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
    out mat3 TBN;

    void main(void) {
        vec4 wPos = vec4(vertexPosition, 1) * modelM;

        uv = vertexTexCoord;
        normal   = (vec4(vertexNormal, 0) * modelM).xyz;
        wLight   = (camera.wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = (camera.wEye * wPos.w - wPos.xyz);
        lightSpacePos = (wPos * camera.lightSpaceMatrix).xyz;
        worldPos = wPos.xyz;

        gl_Position = wPos * camera.viewProj;
    }
`;