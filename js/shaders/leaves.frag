Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    in vec2 uv;
    in vec3 normal;

    out vec4 fragmentColor;

    uniform sampler2D leaves;
    uniform sampler2D leaves_alpha;
    uniform sampler2D leaves_translucency;

    void main(void) {

        vec3 color = texture(leaves, uv).rgb;
        float alpha = texture(leaves_alpha, uv).r;
        vec3 translucency = texture(leaves_translucency, uv).rgb;

        if (alpha < 0.8) {
            discard;
        }
        vec3 N = normalize(normal);

        fragmentColor = vec4(translucency + vec3(255,192,203)/255.0*0.0, alpha);
        // fragmentColor = vec4(N*0.5+0.5, 1);
        // fragmentColor = vec4(1, 0, 0, 1);
    }
`;