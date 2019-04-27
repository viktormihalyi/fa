Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

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
        return f / 65536.0; // + 0.5
    }

    in vec4 worldPos;
    in vec3 lightSpacePos;

    uniform sampler2D depthTexture;

    float fun(float x) {
        if (x < 0.33) {
            return 0.0;
        } else if (x > 0.66) {
            return 1.0;
        } else {
            return x;
        }
    }

    void main(void) {
        vec3 worldPos3 = worldPos.xyz / worldPos.w * 5.0;


        vec3 desert_brown = vec3(0.93, 0.79, 0.69);
        vec3 wood_brown   = vec3(0.76, 0.60, 0.42);
        vec3 walnut_brown = vec3(0.36, 0.32, 0.28);
        vec3 dark_brown   = vec3(0.40, 0.26, 0.13);


        vec3 light_brown = vec3(0.51, 0.45, 0.40);
        vec3 more_brown  = vec3(0.37, 0.26, 0.16);


        vec3 nsc3 = vec3(1, 0.07, 1);
        vec3 nsc2 = vec3(1, 0.2, 1);
        float t = snoise(worldPos3*nsc3, 16);
        t = t > 0.5 ? 1.0 : 0.0;

        vec3 color = mix(mix(wood_brown, dark_brown, snoise(worldPos3*nsc2*2.0, 16)), mix(light_brown, more_brown, fun(t)), 0.6);
        vec3 shadow_coord = lightSpacePos*0.5+0.5;
        if (texture(depthTexture, shadow_coord.xy).r < shadow_coord.z-0.005) {
            color *= 0.1;
            // color = vec3(1, 0, 0);
        }

        fragmentColor = vec4(color, 1);
    }
`;