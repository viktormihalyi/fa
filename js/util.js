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