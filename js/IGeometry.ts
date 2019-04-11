interface IGeometry {
    [x: string]: any;

    gl: WebGL2RenderingContext;

    draw(): void;
}


