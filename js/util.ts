function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`assertion failed: ${message}`)
    }
}

function radians(x: number): number {
    return x / 180 * Math.PI;
}

function degrees(x: number): number {
    return x * 180 / Math.PI;
}

function rad(x: number): number {
    return radians(x);
}

function deg(x: number): number {
    return degrees(x);
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function randomBetweenFloat(min: number, max: number): number {
    return Math.random()*(max-min)+min;
}

function lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

function round_to_tenths(x: number): number {
    return Math.round(x*10)/10;
}

// vec3 to string
function pv(vec: Vec3): string {
    return `(${round_to_tenths(vec.x)}, ${round_to_tenths(vec.y)}, ${round_to_tenths(vec.z)})`
}

function projectVectorToPlane(A: Vec3, plane_normal: Vec3): Vec3 {
    return plane_normal.cross(A.cross(plane_normal));
}


function furthestPointInDirection(listOfPoints: Vec3[], direction: Vec3): Vec3 | null {
    assert(listOfPoints.length > 0, 'empty array');

    let furthestPoint = null;
    let furthestPointDistance = Number.MIN_SAFE_INTEGER;
    for (const point of listOfPoints) {
        const dist = point.dot(direction);
        if (dist > furthestPointDistance) {
            furthestPoint = point;
            furthestPointDistance = dist;
        }
    }

    assert(furthestPoint !== null, 'wtf');
    return furthestPoint;
}


function distanceToLineSegment(point: Vec3, start: Vec3, end: Vec3) {
    const l2 = start.minus(end).length2();
    if (l2 === 0.0) {
        return point.minus(start).length();
    }
    const t = Math.max(0, Math.min(1, point.minus(start).dot(end.minus(start)) / l2));
    const projection = start.plus(end.minus(start).times(t));
    const dist = point.minus(projection).length();
    return dist;
}

const _0 = new Vec3();
const _1 = new Vec3();
const _2 = new Vec3();
const _3 = new Vec3();
const _4 = new Vec3();

function distanceToLineSegment2(point: Vec3, start: Vec3, end: Vec3): number {
    _0.set(start).sub(end);
    _1.set(point).sub(start);

    const l2 = _0.length2();
    if (l2 === 0.0) {
        return _1.length();
    }

    _2.set(end).sub(start);
    const t = Math.max(0, Math.min(1, _1.dot(_2)/l2));
    _3.set(start).add(_2.mul(t));
    _4.set(point).sub(_3);
    return _4.length();
}

function vec3ArrayToFloat32Array(array: Vec3[]): Float32Array {
    return new Float32Array(array.flatMap((vec: Vec3): number[] => [vec.x, vec.y, vec.z]));
}

function vec2ArrayToFloat32Array(array: Vec2[]): Float32Array {
    return new Float32Array(array.flatMap((vec: Vec2): number[] => [vec.x, vec.y]));
}

function lerpVec3(vec0: Vec3, vec1: Vec3, t: number): Vec3 {
    return new Vec3(
        lerp(vec0.x, vec1.x, t),
        lerp(vec0.y, vec1.y, t),
        lerp(vec0.z, vec1.z, t),
    );
}

function roundVec3(vec: Vec3): Vec3 {
    return new Vec3(
        Math.round(vec.x),
        Math.round(vec.y),
        Math.round(vec.z),
    )
}

// https://en.wikipedia.org/wiki/File:Catmull-Rom_Parameterized_Time.png
// centripetal: alpha = 0.5
// uniform:     alpha = 0
// chordal:     alpha = 1
const ALPHA = 1;
const EPSILON = 1e-2;

// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
// centripetal catmull rom spline
function catmull_rom_spline(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
    const t0 = 0;
    const t1 = tj(t0, p0, p1);
    const t2 = tj(t1, p1, p2);
    const t3 = tj(t2, p2, p3);

    t = lerp(t1, t2, t);

    const a1 = p0.times((t1-t) / (t1-t0)).plus(p1.times((t-t0) / (t1-t0)));
    const a2 = p1.times((t2-t) / (t2-t1)).plus(p2.times((t-t1) / (t2-t1)));
    const a3 = p2.times((t3-t) / (t3-t2)).plus(p3.times((t-t2) / (t3-t2)));

    const b1 = a1.times((t2-t) / (t2-t0)).plus(a2.times((t-t0) / (t2-t0)));
    const b2 = a2.times((t3-t) / (t3-t1)).plus(a3.times((t-t1) / (t3-t1)));

    const c  = b1.times((t2-t) / (t2-t1)).plus(b2.times((t-t1) / (t2-t1)));
    return c;
}

function tj(ti: number, pi: Vec3, pj: Vec3): number {
    let len = Math.max(EPSILON, pj.minus(pi).length());
    return Math.pow(len, ALPHA) + ti;
}

function normalVectorForTriangle(node1: Vec3, node2: Vec3, node3: Vec3): Vec3 {
    const area = node2.minus(node1).length() * node2.minus(node3).length() / 2;
    return node2.minus(node1).cross(node2.minus(node3)).times(area);
}

// tangent, normal, binormals must be normalized
function createOrientationMatrix(tangent: Vec3, normal: Vec3, binormal?: Vec3): Mat4 {
    const t = tangent;
    const n = normal;
    const b = binormal || t.cross(n).normalize();
    // wtf
    return new Mat4(
        b.x, b.y, b.z, 0,
        t.x, t.y, t.z, 0,
        n.x, n.y, n.z, 0,
        0,   0,   0,   1
    );
}