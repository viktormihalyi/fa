Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    in vec2 uv;

    uniform sampler2D leaves_alpha;

    void main(void) {
        float alpha = texture(leaves_alpha, uv).r;
        if (alpha < 0.95) {
            discard;
        }
    }
`;