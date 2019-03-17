Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
    precision highp float;

    in vec3 normal;
    in vec2 uv;

    out vec4 fragmentColor;

    uniform sampler2D tree;

    void main(void) {
        fragmentColor = vec4(texture(tree, uv));
        // fragmentColor = vec4(uv, 0, 1);
        fragmentColor = vec4(normalize(normal*0.5+0.5), 1);
    }
`;