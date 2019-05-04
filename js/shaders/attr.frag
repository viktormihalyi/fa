Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    out vec4 fragmentColor;

    in vec3 worldPos;
    in vec3 lightSpacePos;

    uniform sampler2D depthTexture;

    uniform struct {
        float strength;
    } shadow;

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
        vec3 color = vec3(0,0,1);
        color *= 1.0-shadow_percentage(depthTexture, lightSpacePos)*shadow.strength;
        fragmentColor = vec4(color, 1);
    }
`;