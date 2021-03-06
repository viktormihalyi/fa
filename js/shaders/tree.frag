Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    uniform sampler2D treeTexture;
    uniform sampler2D treeTextureNorm;
    uniform sampler2D treeTextureHeight;
    uniform sampler2D mossTexture;
    uniform sampler2D mossTextureNorm;
    uniform sampler2D mossTextureHeight;
    uniform sampler2D depthTexture;

    uniform float mossyness;

    uniform float rendermode;

    uniform struct {
        float strength;
        vec3 middlePoint;
        float maxDistance;
    } shadow;

    in vec3 lightSpacePos;
    in vec3 modelPosition;
    in vec3 actualWorldPos;
    in vec3 worldPos;
    in vec3 wNormal;
    in vec3 wView;
    in vec3 wCamera;
    in vec3 wLight;
    in vec3 wEye;
    in vec2 texCoord;
    in mat3 TBN;

    out vec4 fragmentColor;


    float snoise(vec3 r) {
        vec3 s = vec3(7502, 22777, 4767);
        float f = 0.0;
        for(int i = 0; i < 16; i++) {
            f += sin(dot(s - vec3(32768, 32768, 32768), r) / 65536.0);
            s = mod(s, 32768.0) * 2.0 + floor(s / 32768.0);
        }
        return f / 32.0 + 0.5;
    }

    float shadow_percentage(sampler2D shadowMap, vec3 lightSpacePos) {
        int shadow_count = 0;

        float bias = 0.005;

        vec3 shadow_coord = lightSpacePos*0.5+0.5;
        vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));

        // 3x3
        for (int x = -1; x <= 1; ++x) {
            for (int y = -1; y <= 1; ++y) {
                float pcfDepth = texture(shadowMap, shadow_coord.xy + vec2(x, y) * texelSize).r;
                if (pcfDepth < shadow_coord.z - bias) {
                    shadow_count++;
                }
            }
        }

        return float(shadow_count) / 9.0;
    }

    void main(void) {
        float shine = 20.0;

        vec3 kd = vec3(1.0, 1.0, 1.0);
        vec3 ks = vec3(1.0, 1.0, 1.0);

        float t = snoise(actualWorldPos/5.0+vec3(100));

        float bark_height = texture(treeTextureHeight, texCoord).r;
        float mossy_rock_height = texture(mossTextureHeight, texCoord).r + t * mossyness - 1.0;


        vec3 N;
        vec3 m;
        float height_diff = bark_height - mossy_rock_height;

        float interpolate_at = 0.15;
        if (height_diff > 0.0 && height_diff < interpolate_at) {
            float interpolated = 1.0 - abs(height_diff) / interpolate_at;
            m = mix(texture(treeTexture, texCoord).rgb, texture(mossTexture, texCoord).rgb, interpolated);
            N = normalize(mix(texture(treeTextureNorm, texCoord).rgb, texture(mossTextureNorm, texCoord).rgb, interpolated) * 2.0 - 1.0);
        } else if (height_diff > 0.0) {
            m = texture(treeTexture, texCoord).rgb;
            N = texture(treeTextureNorm, texCoord).rgb * 2.0 - 1.0;
        } else {
            m = texture(mossTexture, texCoord).rgb;
            N = texture(mossTextureNorm, texCoord).rgb * 2.0 - 1.0;
        }

        // uncomment to 'disable' normal map
        // N = normalize(wNormal);


        vec3 V = normalize(wView);
        vec3 L = normalize(wLight);
        vec3 H = normalize(L + V);

        float nl = max(dot(N, L), 0.0);
        float nv = max(dot(N, V), 0.0);
        float nh = max(dot(N, H), 0.0);

        vec3 color = m * max(kd * nl + ks * pow(nh, 1.0) * nl / max(nv, nl), 0.75);
        // color *= distance(modelPosition, shadow.middlePoint) / (shadow.maxDistance * 0.8);
        color *= 1.0 - shadow_percentage(depthTexture, lightSpacePos) * shadow.strength;

        fragmentColor = vec4(color, 1);

        switch (int(rendermode)) {
            case 1: fragmentColor = texture(treeTexture, texCoord); break;
            case 2: fragmentColor = vec4(m, 1); break;
            case 3: fragmentColor = vec4(N*0.5 + 0.5, 1); break;
            case 4: fragmentColor = vec4(texCoord, 0, 1); break;
            case 5: fragmentColor = vec4(vec3(t), 1); break;
        }
    }
`;