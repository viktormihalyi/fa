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

function vec3ArrayToFloat32Array(array) {
    return new Float32Array(array.flatMap((vec) => [vec.x, vec.y, vec.z]));
}

function vec2ArrayToFloat32Array(array) {
    return new Float32Array(array.flatMap((vec) => [vec.x, vec.y]));
}
