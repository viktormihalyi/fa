Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    in vec3 vertexPosition;
    in vec3 vertexNormal;
    in vec2 vertexTexCoord;

    in vec3 tangent;
    in vec3 bitangent;

    uniform struct {
        mat4 modelMatrix;
        mat4 lightSpaceMatrix;
        vec3 wLiPos;
        vec3 wEye;
        mat4 viewProj;
    } camera;

    out vec3 lightSpacePos;
    out vec3 modelPosition;
    out vec2 texCoord;
    out vec3 wNormal;
    out vec3 wLight;
    out vec3 wView;
    out vec3 wEye;
    out vec3 worldPos;
    out mat3 TBN;

    #define normal

    void main(void) {
        wEye = camera.wEye;

        vec3 T = normalize((vec4(tangent,      0) * camera.modelMatrix).xyz);
        vec3 B = normalize((vec4(bitangent,    0) * camera.modelMatrix).xyz);
        vec3 N = normalize((vec4(vertexNormal, 0) * camera.modelMatrix).xyz);
        mat3 TBN = transpose(mat3(T, B, N));
        TBN = TBN;

        vec4 wPos = vec4(vertexPosition, 1) * camera.modelMatrix;
#ifdef normal
        wLight   = TBN * (camera.wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = TBN * (camera.wEye * wPos.w - wPos.xyz);
        wNormal  = TBN * ((vec4(vertexNormal, 0) * camera.modelMatrix).xyz);
        worldPos = TBN * wPos.xyz;
#else
        wLight   = (camera.wLiPos.xyz * wPos.w - wPos.xyz);
        wView    = (camera.wEye * wPos.w - wPos.xyz);
        wNormal  = ((vec4(vertexNormal, 0) * camera.modelMatrix).xyz);
        worldPos = wPos.xyz;
#endif
        lightSpacePos = (wPos * camera.lightSpaceMatrix).xyz;
        texCoord = vertexTexCoord;
        modelPosition = vertexPosition;

        gl_Position = wPos * camera.viewProj;
    }
`;