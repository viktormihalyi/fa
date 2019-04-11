// https://www.scratchapixel.com/lessons/advanced-rendering/bezier-curve-rendering-utah-teapot/bezier-surface
class BezierSurface {
    private static EPSILON = 1e-4;

    private P: number[];
    private N: number;
    private M: number;


    // points: a N*M length array
    // N: number of rows
    // M: number of columns
    constructor(points: number[], N: number, M: number) {
        assert(points.length === N*M, 'bad array size');

        this.P = points;
        this.N = N;
        this.M = M;
    }

    // iterative factorial func
    static _factorial(n: number): number {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // https://en.wikipedia.org/wiki/Binomial_coefficient
    static _binomial_coefficient(n: number, i: number): number {
        return BezierSurface._factorial(n) /
            (BezierSurface._factorial(i) * BezierSurface._factorial(n-i));
    }

    // https://en.wikipedia.org/wiki/Bernstein_polynomial
    static _bernstein_polynomial(n: number, i: number, u: number): number {
        return BezierSurface._binomial_coefficient(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i);
    }

    static _evalBezierCurve(points: Vec3[], t: number): Vec3 {
        // bernstein polynomials
        let b = new Array(points.length);
        for (let i = 0; i < points.length; i++) {
            b[i] = BezierSurface._bernstein_polynomial(points.length - 1, i, t);
        }

        // sum point * bernstein polynomials
        let result = points[0].times(b[0]);
        for (let i = 1; i < points.length; i++) {
            result.add(points[i].times(b[i]))
        }
        return result;
    }

    // u: [0, 1]
    // v: [0, 1]
    pointAt(u: number, v: number): Vec3 {
        const Pu = new Array(this.N);
        for (let i = 0; i < this.N; i++) {
            const curveP = new Array(this.M);
            for (let j = 0; j < this.M; j++) {
                curveP[j] = this.P[i*this.M + j];
            }
            Pu[i] = BezierSurface._evalBezierCurve(curveP, u);
        }

        return BezierSurface._evalBezierCurve(Pu, v);
    }

    // TODO fix
    _duBezier(u: number, v: number): Vec3 {
        let p1 = this.pointAt(u, v);
        let p2 = this.pointAt(u + BezierSurface.EPSILON, v);
        return p2.minus(p1).normalize();
    }

    // TODO fix
    _dvBezier(u: number, v: number): Vec3 {
        let p1 = this.pointAt(u, v);
        let p2 = this.pointAt(u, v + BezierSurface.EPSILON);
        return p2.minus(p1).normalize();
    }

    // u: [0, 1]
    // v: [0, 1]
    normalAt(u: number, v: number): Vec3 {
        return     this._duBezier(u, v)
            .cross(this._dvBezier(u, v))
            .normalize();
    }
}