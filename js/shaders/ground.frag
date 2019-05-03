Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    out vec4 fragmentColor;

    in vec4 worldPos;
    in vec3 lightSpacePos;

    uniform sampler2D depthTexture;

    uniform struct {
        float strength;
    } shadow;

    float snoise(vec3 r) {
        vec3 s = vec3(7502, 22777, 4767);
        float f = 0.0;
        for(int i = 0; i < 16; i++) {
            f += sin(dot(s - vec3(32768, 32768, 32768), r) / 65536.0);
            s = mod(s, 32768.0) * 2.0 + floor(s / 32768.0);
        }
        return f / 32.0 + 0.5;
    }

    bool is_out_of_01(vec3 pos) {
        return pos.x > 1.0 || pos.y > 1.0 || pos.z > 1.0;
            //    pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0;
    }

    float shadow_percentage(sampler2D shadowMap, vec3 lightSpacePos) {
        vec3 shadow_coord = lightSpacePos*0.5+0.5;
        if (is_out_of_01(shadow_coord)) {
            return 0.0;
        }

        int shadow_count = 0;
        vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));
        float bias = 0.005;

        // 5x5
        for (float x = -1.0; x <= 1.0; x += 0.5) {
            for (float y = -1.0; y <= 1.0; y += 0.5) {
                float dep = texture(shadowMap, shadow_coord.xy + vec2(x, y) * texelSize).r;
                if (dep < shadow_coord.z - bias) {
                    shadow_count++;
                }
            }
        }

        return float(shadow_count) / 25.0;
    }

    float shadow_diff(sampler2D shadowMap, vec3 lightSpacePos) {
        vec3 shadow_coord = lightSpacePos*0.5+0.5;
        float dep = texture(shadowMap, shadow_coord.xy).r;
        return shadow_coord.z - dep;
    }

    void main(void) {
        float noise = snoise((worldPos.xyz / worldPos.w)/20.0);

        vec3 color = mix(vec3(86,125,70)/255.0, vec3(34,139,34)/255.0, noise);
        color = vec3(1, 1, 1);

        color *= 1.0-shadow_percentage(depthTexture, lightSpacePos)*shadow.strength;

        fragmentColor = vec4(color, 1);
    }
`;