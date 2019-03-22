Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    uniform sampler2D treeTexture;
    uniform sampler2D treeTextureNorm;

    in vec3 worldPos;
    in vec3 wNormal;
    in vec3 wView;
    in vec3 wLight;
    in vec2 texCoord;
    in mat3 TBN;

    out vec4 fragmentColor;

    void main(void) {
        float shine = 20.0;

        vec3 kd = vec3(0.9, 0.7, 0.5);
        vec3 ks = vec3(0.8, 0.8, 0.8);
        vec3 ka = vec3(0.5, 0.5, 0.5);

        vec3 La = vec3(0.8, 0.8, 0.8);
        vec3 Le = vec3(0.6, 0.6, 0.6);

        vec3 N;
        N = texture(treeTextureNorm, texCoord).rgb;
        N = normalize(N * 2.0 - 1.0);

        // uncomment to 'disable' normal map
        // N = normalize(wNormal);

        vec3 V = normalize(wView);
        vec3 L = normalize(wLight);
        vec3 H = normalize(L + V);

        float cost = max(dot(N, L), 0.0);
        float cosd = max(dot(N, H), 0.0);

        vec3 texColor = texture(treeTexture, texCoord).rgb;
        vec3 color = ka * texColor * La + (kd * texColor * cost + ks * pow(cosd, shine)) * Le;
        fragmentColor = vec4(color, 1);

        // fragmentColor = texture(treeTexture, texCoord);
        // fragmentColor = vec4(N*0.5 + 0.5, 1);
        // fragmentColor = vec4(texCoord, 1, 1);
    }
`;