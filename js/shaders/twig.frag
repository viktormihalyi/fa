Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    out vec4 fragmentColor;

    in vec3 worldPos;
    in vec3 lightSpacePos;

    uniform sampler2D depthTexture;

    uniform struct {
        float strength;
        vec3 middlePoint;
        float maxDistance;
    } shadow;

    float snoise(vec3 r, int it) {
        vec3 s = vec3(7502, 22777, 4767);
        float f = 0.0;
        for(int i = 0; i < it; i++) {
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
        vec3 nsc3 = vec3(1, 0.07, 1)*5.0;
        float t = snoise(worldPos*nsc3, 16);

        vec3 color = vec3(85,107,47)/255.0*t;
        // color *= distance(worldPos, shadow.middlePoint) / (shadow.maxDistance * 0.8);
        color *= 1.0-shadow_percentage(depthTexture, lightSpacePos)*shadow.strength;

        fragmentColor = vec4(color, 1);
    }
`;