Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    in vec2 uv;
    in vec3 normal;
    in vec3 worldPos;
    in vec3 wView;
    in vec3 wCamera;
    in vec3 wLight;
    in vec3 wEye;
    in vec3 lightSpacePos;

    out vec4 fragmentColor;

    uniform sampler2D leaves;
    uniform sampler2D leaves_alpha;
    uniform sampler2D leaves_translucency;
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

    void main(void) {
        float alpha = texture(leaves_alpha, uv).r;
        if (alpha < 0.95) {
            discard;
        }

        float shine = 2.0;

        vec3 kd = vec3(1.0, 1.0, 1.0);
        vec3 ks = vec3(1.0, 1.0, 1.0);

        vec3 translucency = texture(leaves_translucency, uv).rgb;
        vec3 N = normalize(normal);
        N = vec3(0, 1, 0);
        vec3 V = normalize(wView);
        vec3 L = normalize(wLight);
        vec3 H = normalize(L + V);

        if (dot(N, L) < 0.0) {
            // N = -N;
        }

        float nl = max(dot(N, L), 0.0);
        float nv = max(dot(N, V), 0.0);
        float nh = max(dot(N, H), 0.0);

        vec3 m = translucency;
        // m = translucency*0.3 + vec3(255,192,203)/255.0*0.7;

        vec3 color = m;// * max(kd * nl + ks * pow(nh, 1.0) * nl / max(nv, nl), 0.6);
        // color *= distance(worldPos, vec3(0, 200, 0)) / 200.0;
        color *= 1.0-shadow_percentage(depthTexture, lightSpacePos)*shadow.strength;

        fragmentColor = vec4(color, alpha);

        // fragmentColor = vec4(N*0.5+0.5, 1);
        // fragmentColor = vec4(1, 0, 0, 1);
        // fragmentColor = vec4(vec3(texture(depthTexture, shadow_coord.xy).r), 1);
    }
`;