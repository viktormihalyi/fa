Shader.source[document.currentScript.src.split(Shader.shaderDirectory)[1]] = `#version 300 es
    precision highp float;

    in vec3 color;

    out vec4 fragmentColor;

    void main(void) {
        fragmentColor = vec4(color, 1);
    }
`;