"use strict";

Math.seedrandom(0);

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

function randomBetween(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

const ATTRACTION_POINT_COUNT = 150;

const CIRCLE_CENTER = new Vec3(0, 0, 0);
const CIRCLE_RADIUS = 30;

const INFL_MIN_DIST = 2;
const INFL_MAX_DIST = 75;

const BRANCH_LENGTH = 1;
const TREE_START_POS = new Vec3(0, -50, 0);
const INITIAL_DIRECTION = new Vec3(0, 1, 0);

let tree = [];
let attractionPoints = [];

class TreeNode {
    constructor(parent, pos, dir, width) {
        this.parent = parent;
        this.pos = pos;
        this.dir = dir.clone().normalize();
        this.width = width;
        this.children = [];
    }
}

function good_point(pos) {
    return pos.minus(CIRCLE_CENTER).length() < CIRCLE_RADIUS;
}

function setup() {
    while (attractionPoints.length < ATTRACTION_POINT_COUNT) {
        const rndpoint = new Vec3(
            randomBetween(-CIRCLE_CENTER.x-CIRCLE_RADIUS, CIRCLE_CENTER.x+CIRCLE_RADIUS),
            randomBetween(-CIRCLE_CENTER.y-CIRCLE_RADIUS, CIRCLE_CENTER.y+CIRCLE_RADIUS),
            randomBetween(-CIRCLE_CENTER.z-CIRCLE_RADIUS, CIRCLE_CENTER.z+CIRCLE_RADIUS));

        if (good_point(rndpoint)) {
            attractionPoints.push(rndpoint);
        }
    }

    tree.push(new TreeNode(null, TREE_START_POS, INITIAL_DIRECTION, 10));
}


// function drawLine(from, to) {
//     ctx.beginPath();
//     ctx.moveTo(from.x, from.y);
//     ctx.lineTo(to.x, to.y);
//     ctx.stroke();
// }

// function render() {
//     ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

//     // draw tree
//     for (let n of tree) {
//         // let n = tree[tree.length-1];
//         if (n.parent !== null) {
//             ctx.fillStyle = "#FF0000";
//             ctx.lineWidth = n.width;
//             drawLine(n.pos, n.parent.pos);
//         }
//     }

//     // draw attraction points
//     for (let point of attractionPoints) {
//         ctx.fillStyle = "#0000FF44";
//         ctx.fillRect(point.x-2, point.y-2, 4, 4);
//     }
// }

function removeReachedAttractionPoints() {
    attractionPoints = attractionPoints.filter((e) => {
        let closestDist = Number.MAX_SAFE_INTEGER;
        for (let treeNode of tree) {
            let dist = treeNode.pos.minus(e).length();
            if (dist < closestDist) {
                closestDist = dist;
            }
        }
        return closestDist >= INFL_MIN_DIST;
    });
}

function update() {
    if (attractionPoints.length === 0 || tree.length > 1500) {
        return;
    }
    console.log(tree.length);

    let influencedNodes = tree.map(node => ({node: node, attrs: []}));

    // find closest node to each attraction point
    let found = false;
    for (let apoint of attractionPoints) {

        let closest = null;
        let closestDist = Number.MAX_SAFE_INTEGER;
        for (let treeNode of tree) {
            let dist = treeNode.pos.minus(apoint).length();
            if (dist < closestDist && INFL_MIN_DIST < dist && dist < INFL_MAX_DIST) {
                closest = treeNode;
                closestDist = dist;
            }
        }

        if (closest !== null) {
            found = true;
            let t = influencedNodes.find((n) => n.node === closest);
            t.attrs.push(apoint);
        }
    }

    // grow tree
    if (!found) {
        // no attraction at all, just grow up
        const lastNode = tree[tree.length-1];
        const newNode = new TreeNode(lastNode, lastNode.pos.plus(lastNode.dir.times(BRANCH_LENGTH)), lastNode.dir, lastNode.width*0.98);
        lastNode.children.push(newNode);
        tree.push(newNode);

    } else {
        // grow according to attractions
        for (let inflNode of influencedNodes) {

            // ignore those tree nodes that have no attraction
            if (inflNode.attrs.length === 0) {
                continue;
            }

            // attraction points whose closest node is the current one
            let attrs = influencedNodes.find((n) => n.node === inflNode.node).attrs;

            // sum up all attrpoint-node directions
            let sumVect = new Vec3(0, 0, 0);
            for (let apoint of attrs) {
                sumVect.add(apoint.minus(inflNode.node.pos));
            }
            sumVect.normalize();
            // also include the previous direction
            sumVect.add(inflNode.node.dir.times(1.2));
            sumVect.normalize();
            sumVect.mul(BRANCH_LENGTH);

            // add node
            const newNode = new TreeNode(inflNode.node, inflNode.node.pos.plus(sumVect), sumVect, inflNode.node.width*0.98);
            inflNode.node.children.push(newNode);
            tree.push(newNode);
        }
    }

    // remove consumed points
    removeReachedAttractionPoints();

    // clear screen
    // render();
}


class Scene {
    constructor(gl) {
        this.vsIdle = new Shader(gl, gl.VERTEX_SHADER, "idle_vs.essl");
        this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
        this.solidProgram = new Program(gl, this.vsIdle, this.fsSolid);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        // this.quadGeometry = new QuadGeometry(gl);
        // this.triangles = new TriangleGeometryInstanced(gl);
        setup();
        this.linesGeometry = new LinesGeometry(gl);

        this.camera = new Camera();
        console.log(this.camera.V().mul(this.camera.P()).p);

    }

    update(gl, keysPressed) {
        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        update();

        // clear the screen
        gl.clearColor(1, 1, 1, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // render

        this.solidProgram.commit();
        this.camera.eyePos.x = 65*Math.sin(t);
        this.camera.eyePos.z = 65*Math.cos(t);
        this.camera.V().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "V"));
        this.camera.P().commit(gl, gl.getUniformLocation(this.solidProgram.glProgram, "P"));


        this.linesGeometry.setPoints(gl, tree);

        this.linesGeometry.draw();
    }
}



