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

    void main(void) {
        float t = snoise((worldPos.xyz / worldPos.w)/10.0);

        vec3 color = mix(vec3(86,125,70)/255.0, vec3(34,139,34)/255.0*0.9, t);

        vec3 shadow_coord = lightSpacePos*0.5+0.5;
        if (/*shadow_coord.z < 0.59 && */ texture(depthTexture, shadow_coord.xy).r < shadow_coord.z-0.005) {
            color *= shadow.strength;
        }

        fragmentColor = vec4(color, 1);
    }
`;