Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    uniform sampler2D treeTexture;
    uniform sampler2D treeTextureNorm;

    in vec3 worldPos;
    in vec3 wNormal;
    in vec3 wView;
    in vec3 wCamera;
    in vec3 wLight;
    in vec3 wEye;
    in vec2 texCoord;
    in mat3 TBN;

    out vec4 fragmentColor;

    float snoise(vec3 r, int it) {
        vec3 s = vec3(7502, 22777, 4767);
        float f = 0.0;
        for(int i = 0; i < it; i++) {
            f += sin(dot(s - vec3(32768, 32768, 32768), r) / 65536.0);
            s = mod(s, 32768.0) * 2.0 + floor(s / 32768.0);
        }
        return f / 32.0 + 0.5;
    }

    vec3 snoiseGrad(vec3 r, int it) {
        vec3 s = vec3(7502, 22777, 4767);
        vec3 f = vec3(0.0, 0.0, 0.0);
        for(int i=0; i < it; i++) {
            f += cos( dot(s - vec3(32768, 32768, 32768), r) / 65536.0) * s;
            s = mod(s, 32768.0) * 2.0 + floor(s / 32768.0);
        }
        return f / 65536.0;
    }

    void main(void) {
        float shine = 20.0;

        vec3 kd = vec3(1.0, 1.0, 1.0);
        vec3 ks = vec3(1.0, 1.0, 1.0);

        vec3 N;
        N = texture(treeTextureNorm, texCoord).rgb;
        N = normalize(N * 2.0 - 1.0);

        vec3 worldPos3 = worldPos * 30.0;
        vec3 nsc2 = vec3(1, 1, 1);
        vec3 nsc3 = vec3(1, 0.01, 1);

        // uncomment to 'disable' normal map
        N = normalize(wNormal + 0.1 * (snoiseGrad(worldPos3*nsc3, 16)*0.4 + snoiseGrad(worldPos3*1.5*nsc3, 16)*0.2 + snoiseGrad(worldPos3*0.5*nsc3, 10)*0.2));

        float t = snoise(worldPos3*nsc3, 16)*0.4 + snoise(worldPos3*1.5*nsc3, 16)*0.2 + snoise(worldPos3*0.5*nsc3, 10)*0.2;

        vec3 V = normalize(wView);
        vec3 L = normalize(wLight);
        vec3 H = normalize(L + V);

        float nl = max(dot(N, L), 0.0);
        float nv = max(dot(N, V), 0.0);
        float nh = max(dot(N, H), 0.0);

        vec3 m;

        vec3 desert_brown = vec3(0.93, 0.79, 0.69);
        vec3 wood_brown   = vec3(0.76, 0.60, 0.42);
        vec3 walnut_brown = vec3(0.36, 0.32, 0.28);
        vec3 dark_brown   = vec3(0.40, 0.26, 0.13);

        m = mix(wood_brown, dark_brown, vec3(t, t, t));
        // m = texture(treeTexture, texCoord).rgb;
        vec3 color = m * max(kd * nl + ks * pow(nh, 1.0) * nl / max(nv, nl), 0.6);
        fragmentColor = vec4(color, 1);

        // fragmentColor = vec4(m, 1);
        // fragmentColor = texture(treeTexture, texCoord);
        // fragmentColor = vec4(N*0.5 + 0.5, 1);
        // fragmentColor = vec4(texCoord, 0, 1);
    }
`;