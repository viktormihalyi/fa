"use strict";

Math.seedrandom(0);

function randomBetween(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

const ATTRACTION_POINT_COUNT = 150;

const CIRCLE_CENTER = new Vec3(0, 0, 0);
const CIRCLE_RADIUS = 33;

const INFL_MIN_DIST = 10;
const INFL_MAX_DIST = 33;

const BRANCH_LENGTH = 5;
const TREE_START_POS = new Vec3(0, -50, 0);
const INITIAL_DIRECTION = new Vec3(0, 1, 0);

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
        this.nodes.push(new TreeNode(null, TREE_START_POS, INITIAL_DIRECTION, 10));

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
        const newNode = new TreeNode(source, source.pos.plus(direction.times(BRANCH_LENGTH)), direction, source.width*0.98);
        source.children.push(newNode);
        this.nodes.push(newNode);
    }

    grow() {
        if (this.attractionPoints.length === 0 || this.nodes.length > 1500) {
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
                sumVect.add(inflNode.node.dir.times(1.2));
                sumVect.normalize();

                // add node
                this.growFrom(inflNode.node, sumVect);
            }
        }

        // remove consumed points
        this.removeReachedAttractionPoints();
    }
}