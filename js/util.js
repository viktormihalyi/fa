function assert(condition, message) {
    if (!condition) {
        throw new Error(`assertion failed: ${message}`)
    }
}

function radians(x) {
    return x / 180 * Math.PI;
}

function degrees(x) {
    return x * 180 / Math.PI;
}

function randomBetween(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

function round_to_tenths(x) {
    return Math.round(x*10)/10;
}

// vec3 to string
function pv(vec) {
    return `(${round_to_tenths(vec.x)}, ${round_to_tenths(vec.y)}, ${round_to_tenths(vec.z)})`
}


function project_to_plane(A, plane_normal) {
    return plane_normal.cross(A.cross(plane_normal));
}

function furthestPointInDirection(listOfPoints, direction) {
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


function distanceToLineSegment(point, start, end) {
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

function distanceToLineSegment2(point, start, end) {
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

function vec3ArrayToFloat32Array(array) {
    return new Float32Array(array.flatMap((vec) => [vec.x, vec.y, vec.z]));
}

function vec2ArrayToFloat32Array(array) {
    return new Float32Array(array.flatMap((vec) => [vec.x, vec.y]));
}

function lerpVec3(vec0, vec1, t) {
    return new Vec3(
        lerp(vec0.x, vec1.x, t),
        lerp(vec0.y, vec1.y, t),
        lerp(vec0.z, vec1.z, t),
    );
}

function roundVec3(vec) {
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
const ALPHA = 0;
const EPSILON = 1e-2;

// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
// centripetal catmull rom spline
function catmull_rom_spline(p0, p1, p2, p3, t) {
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

function tj(ti, pi, pj) {
    let len = Math.max(EPSILON, pj.minus(pi).length());
    return Math.pow(len, ALPHA) + ti;
}

function normalVectorForTriangle(node1, node2, node3) {
    const area = node2.minus(node1).length() * node2.minus(node3).length() / 2;
    return node2.minus(node1).cross(node2.minus(node3)).times(area);
}