function assert(condition, message) {
    if (!condition) {
        throw new Error(`assertion failed: ${message}`)
    }
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
    const result = new Float32Array(array.length * 3);
    let iter = 0;
    for (const element of array) {
        result[iter++] = element.x;
        result[iter++] = element.y;
        result[iter++] = element.z;
    }
    return result;
}

function vec2ArrayToFloat32Array(array) {
    const result = new Float32Array(array.length * 2);
    let iter = 0;
    for (const element of array) {
        result[iter++] = element.x;
        result[iter++] = element.y;
    }
    return result;
}