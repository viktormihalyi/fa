Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;

    in vec3 tangent;
    in vec3 bitangent;

    uniform vec3 wLiPos;

    uniform struct {
        vec3 wEye;
        mat4 viewProj;
    } camera;

    out vec2 texCoord;
    out vec3 wNormal;
    out vec3 wLight;
    out vec3 wView;
    out vec3 wEye;
    out vec3 worldPos;
    out mat3 TBN;

    // #define normal

    void main(void) {
        wEye = camera.wEye;

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
        TBN = TBN;

        vec4 wPos = vec4(vertexPosition, 1) * modelMatrix;
#ifdef normal
        wLight   = TBN * (wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = TBN * (camera.wEye * wPos.w - wPos.xyz);
        wNormal  = TBN * ((vec4(vertexNormal, 0) * modelMatrix).xyz);
        worldPos = TBN * wPos.xyz;
#else
        wLight   = (wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = (camera.wEye * wPos.w - wPos.xyz);
        wNormal  = ((vec4(vertexNormal, 0) * modelMatrix).xyz);
        worldPos = wPos.xyz;
#endif
        texCoord = vertexTexCoord;

        gl_Position = wPos * camera.viewProj;
    }
`;