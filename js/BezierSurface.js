// https://www.scratchapixel.com/lessons/advanced-rendering/bezier-curve-rendering-utah-teapot/bezier-surface
class BezierSurface {

    // points: a N*M length array
    // N: number of rows
    // M: number of columns
    constructor(points, N, M) {
        assert(points.length === N*M, 'bad array size');

        this.P = points;
        this.N = N;
        this.M = M;

        this.EPSILON = 1e-4;
    }

    // iterative factorial func
    static _factorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // https://en.wikipedia.org/wiki/Binomial_coefficient
    static _binomial_coefficient(n, i) {
        return BezierSurface._factorial(n) /
            (BezierSurface._factorial(i) * BezierSurface._factorial(n-i));
    }

    // https://en.wikipedia.org/wiki/Bernstein_polynomial
    static _bernstein_polynomial(n, i, u) {
        return BezierSurface._binomial_coefficient(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i);
    }

    static _evalBezierCurve(points, t) {
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
    pointAt(u, v) {
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

    _duBezier(u, v) {
        let p1 = this.pointAt(u, v);
        let p2 = this.pointAt(u + this.EPSILON, v);
        return p2.minus(p1).normalize();
    }

    _dvBezier(u, v) {
        let p1 = this.pointAt(u, v);
        let p2 = this.pointAt(u, v + this.EPSILON);
        return p2.minus(p1).normalize();
    }

    // u: [0, 1]
    // v: [0, 1]
    normalAt(u, v) {
        return     this._duBezier( u, v)
            .cross(this._dvBezier(u, v))
            .normalize();
    }
}