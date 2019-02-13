"use strict";

Math.seedrandom(0);

function randomBetween(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

const ATTRACTION_POINT_COUNT = 250;

const CIRCLE_CENTER = new Vec3(0, 100, 0);
const CIRCLE_RADIUS = 100;

const INFL_MIN_DIST = 16;
const INFL_MAX_DIST = 50;

const BRANCH_LENGTH = 8;
const TREE_START_POS = new Vec3(0, -20, 0);
const INITIAL_DIRECTION = new Vec3(0, 1, 0);

const MAX_TREE_SIZE = 2500;

class TreeNode {
    constructor(parent, pos, dir, width, normal) {
        this.parent = parent;
        this.pos = pos;
        this.dir = dir.clone().normalize();
        this.width = width;
        this.children = [];
        this.normal = normal;
    }
}


class Tree {
    constructor() {
        this.nodes = [];
        this.nodes.push(new TreeNode(null, TREE_START_POS, INITIAL_DIRECTION, 10, new Vec3(0, 0, 1)));

        this.attractionPoints = [];
        while (this.attractionPoints.length < ATTRACTION_POINT_COUNT) {
            const rndpoint = new Vec3(
                randomBetween(-CIRCLE_CENTER.x-CIRCLE_RADIUS, CIRCLE_CENTER.x+CIRCLE_RADIUS),
                randomBetween(-CIRCLE_CENTER.y-CIRCLE_RADIUS, CIRCLE_CENTER.y+CIRCLE_RADIUS),
                randomBetween(-CIRCLE_CENTER.z-CIRCLE_RADIUS, CIRCLE_CENTER.z+CIRCLE_RADIUS));

            if (this.good_point(rndpoint)) {
                this.attractionPoints.push(rndpoint);
            }
        }
    }

    lel() {
        for (let node of this.nodes) {
            for (let child of node.children) {

                for (let grandchild of child.children) {

                    let first = null;
                    let last = null;
                    for (let t = 0; t < 1; t += 0.1) {
                        const prev = node.parent || node;

                        const interpolated_pos    = catmull_rom_spline(prev.pos,    node.pos,    child.pos,    grandchild.pos,    t);
                        const interpolated_dir    = catmull_rom_spline(prev.dir,    node.dir,    child.dir,    grandchild.dir,    t);
                        const interpolated_normal = catmull_rom_spline(prev.normal, node.normal, child.normal, grandchild.normal, t);

                        const newNode = new TreeNode(node, interpolated_pos, interpolated_dir, lerp(node.width, child.width, t), interpolated_normal);
                        last = newNode;
                        node.children.push(newNode);
                        this.nodes.push(newNode);

                        if (first === null) {
                            first = newNode;

                            let index = node.children.indexOf(child);
                            node.children.splice(index, 1);
                        }
                    }

                    child.parent = last;
                }
            }
        }
    }

    good_point(pos) {
        return pos.minus(CIRCLE_CENTER).length() < CIRCLE_RADIUS;
    }

    removeReachedAttractionPoints() {
        this.attractionPoints = this.attractionPoints.filter((e) => {
            let closestDist = Number.MAX_SAFE_INTEGER;
            for (let treeNode of this.nodes) {
                let dist = treeNode.pos.minus(e).length();
                if (dist < closestDist) {
                    closestDist = dist;
                }
            }
            return closestDist >= INFL_MIN_DIST;
        });
    }

    growFrom(source, direction) {
        // https://solitaryroad.com/c253.html
        // modelling the mighty maple
        const acceleration_vector = direction.minus(source.dir).normalize();
        const principal_normal = direction.cross(acceleration_vector).cross(direction);
        const newNode = new TreeNode(source, source.pos.plus(direction.times(BRANCH_LENGTH)), direction, source.width*0.98, principal_normal);
        source.children.push(newNode);
        this.nodes.push(newNode);
    }

    grow() {
        if (this.attractionPoints.length === 0 || this.nodes.length >= MAX_TREE_SIZE) {
            return;
        }

        console.log(this.nodes.length);

        let influencedNodes = this.nodes.map(node => ({node: node, attrs: []}));

        // find closest node to each attraction point
        let found = false;
        for (let apoint of this.attractionPoints) {

            let closest = null;
            let closestDist = Number.MAX_SAFE_INTEGER;
            for (let treeNode of this.nodes) {
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
            const lastNode = this.nodes[this.nodes.length - 1];
            this.growFrom(lastNode, lastNode.dir);


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
                    // sumVect.add(apoint.minus(inflNode.node.pos).normalize());
                    sumVect.add(apoint.minus(inflNode.node.pos));
                }
                sumVect.normalize();
                // also include the previous direction
                sumVect.add(inflNode.node.dir.times(2));
                sumVect.normalize();

                // add node
                this.growFrom(inflNode.node, sumVect);
            }
        }

        // remove consumed points
        this.removeReachedAttractionPoints();
    }
}