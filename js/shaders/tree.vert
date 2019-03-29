Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;

    in vec3 tangent;
    in vec3 bitangent;

    uniform struct {
        vec3 wEye;
        mat4 viewProj;
    } camera;

    out vec2 texCoord;
    out vec3 wNormal;
    out vec3 wLight;
    out vec3 wView;
    out vec3 worldPos;
    out mat3 TBN;

    void main(void) {
        vec4 wLiPos = vec4(0, 2000, 100, 1);

        mat4 modelMatrix = mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );

        vec3 T = normalize((vec4(tangent,      0) * modelMatrix).xyz);
        vec3 B = normalize((vec4(bitangent,    0) * modelMatrix).xyz);
        vec3 N = normalize((vec4(vertexNormal, 0) * modelMatrix).xyz);
        mat3 TBN = transpose(mat3(T, B, N));

        vec4 wPos = vec4(vertexPosition, 1) * modelMatrix;
        wLight   = TBN * (wLiPos.xyz * wPos.w - wPos.xyz * wLiPos.w);
        wView    = TBN * (camera.wEye * wPos.w - wPos.xyz);
        wNormal  = TBN * ((vec4(vertexNormal, 0) * modelMatrix).xyz);
        worldPos = TBN * wPos.xyz;

        texCoord = vertexTexCoord;

        gl_Position = wPos * camera.viewProj;
    }
`;