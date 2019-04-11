Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    in vec4 worldPos;
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


    void main(void) {
        vec3 worldPos3 = worldPos.xyz / worldPos.w * 5.0;
        vec3 nsc3 = vec3(1, 0.07, 1);
        float t = snoise(worldPos3*nsc3, 16);
        fragmentColor = vec4(vec3(85,107,47)/255.0*t, 1);
    }
`;