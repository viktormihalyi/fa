Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    out vec4 fragmentColor;

    in vec2 uv;

    uniform sampler2D text;

    void main(void) {
        float depth = texture(text, vec2(uv.x, 1.0-uv.y)).r;
        fragmentColor = vec4(vec3(depth), 1.0);
        // fragmentColor = vec4(uv, 0.0, 1.0);
    }
`;