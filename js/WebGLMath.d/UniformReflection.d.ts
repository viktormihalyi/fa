declare class UniformReflection {
    static addProperties(gl: WebGLRenderingContext, glProgram: WebGLProgram, target: any, structTargets?: any): any;

    static commitProperties(gl: WebGLRenderingContext, glProgram: WebGLProgram, source: any, structSources?: any): any;

    static makeProxy(target: any, type: any): any;

    static makeVar(gl: WebGLRenderingContext, type: any, arraySize: number, samplerIndex: any): any;

    static float(arraySize: number): any;
    static vec2(arraySize: number): any;
    static vec3(arraySize: number): any;
    static vec4(arraySize: number): any;
    static mat4(arraySize: number): any;
    static sampler2D(arraySize: number, samplerIndex: any): any;
    static samplerCube(arraySize: number, samplerIndex: any): any;
}

declare const Uniforms: any;