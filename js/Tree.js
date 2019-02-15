"use strict";

Math.seedrandom(1);

// number of attraction points to generate
const ATTRACTION_POINT_COUNT = 100;

// attraction points generation around a circle
const CIRCLE_CENTER = new Vec3(0, 150, 0);
const CIRCLE_RADIUS = 50;

// space colonization algorithm constants
const INFL_MIN_DIST = 12*2;
const INFL_MAX_DIST = 60*2;
const BRANCH_LENGTH = 15*3;

// starting tree node values
const TREE_INITIAL_POS = new Vec3(0, 0, 0);
const TREE_INITIAL_DIRECTION = new Vec3(0, 1, 0);
const TREE_INITIAL_NORMAL = new Vec3(0, 0, 1);
const TREE_STARTING_WIDTH = 5;

// stop grwoing after reaching this many tree nodes
const MAX_TREE_SIZE = 50;

// how much the previous growing direction should affect the next node
// 0 - not taken into consideration
const PREVIOUS_DIR_POWER = 1;

// width scales with each node
const BRANCH_WIDTH_SCALE = 0.7;

class TreeNode {
    constructor(parent, pos, dir, width, normal) {
        this.parent = parent;
        this.pos = pos;
        this.dir = dir.clone().normalize();
        this.width = width;
        this.children = [];
        this.normal = normal.clone().normalize();
    }

    binormal() {
        return this.dir.cross(this.normal).normalize();
    }

    getDominantChild() {
        let dominantChild = null;
        let smallestAngle = Number.MAX_SAFE_INTEGER;
        for (let child of this.children) {
            const angle = this.dir.dot(child.dir);
            if (angle < smallestAngle) {
                smallestAngle = angle;
                dominantChild = child;
            }
        }
        return dominantChild;
    }
}

class Tree {
    constructor() {
        this.nodes = [];
        this.attractionPoints = [];

        // setup starting tree - just one one
        this.nodes.push(new TreeNode(
            null, // parent
            TREE_INITIAL_POS,
            TREE_INITIAL_DIRECTION,
            TREE_STARTING_WIDTH,
            TREE_INITIAL_NORMAL));

        // generate attraction points
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

    // return a new node
    // parent is null
    interpolate_node_between(node, nodes_child, t) {
        const prev = node.parent || node;
        const grandchild = nodes_child.getDominantChild() || nodes_child;

        const interpolated_pos    = catmull_rom_spline(prev.pos,    node.pos,    nodes_child.pos,    grandchild.pos,    t);
        const interpolated_dir    = catmull_rom_spline(prev.dir,    node.dir,    nodes_child.dir,    grandchild.dir,    t);
        const interpolated_normal = catmull_rom_spline(prev.normal, node.normal, nodes_child.normal, grandchild.normal, t);

        return new TreeNode(null, interpolated_pos, interpolated_dir, lerp(node.width, nodes_child.width, t), interpolated_normal);
    }


    // - interpolates the tree nodes with splines
    // - currently uses the centripetal catmull rom splnie
    // - the argument means how many extra nodes
    //   we want to insert between 2 nodes
    lel(mennyit) {

        // setting parents is fine during the iteration
        // but setting children will result in an infinite loop
        // so they are saved here, and will be set after the loops
        let newNodes = [];
        let newChildParents = [];

        for (const node of this.nodes) {

            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];

                // use this variable for setting the next node's parent
                let last = node;

                // spline between node (from) and child (to)
                for (let j = 1; j <= mennyit; j++) {
                    const t = j / (mennyit + 1);

                    const newNode = this.interpolate_node_between(node, child, t);

                    // parent should be the previous node
                    newNode.parent = last;

                    // save the relationship for the end
                    newChildParents.push({
                        child: newNode,
                        parent: last
                    })

                    // save the node for inserting into the Tree#nodes list later
                    newNodes.push(newNode);


                    // first iteration, set the FROM nodes children
                    if (j === 1) {
                        node.children[i] = newNode;
                    }

                    // save the last
                    last = newNode;
                }

                // the last interpolated node AND the child (to) 's relationship
                last.children.push(child);
                child.parent = last;
            }
        }

        for (let rel of newChildParents) {
            rel.parent.children.push(rel.child);
        }
        this.nodes.push(...newNodes);
    }

    good_point(pos) {
        return pos.minus(CIRCLE_CENTER).length() < CIRCLE_RADIUS;
    }

    // keep only the attraction points which are further
    // away than a specific distance from all tree nodes
    removeReachedAttractionPoints() {
        this.attractionPoints = this.attractionPoints.filter((e) => {
            // search for the closest tree node's distance
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

    /*
    calculates a rotation minimizing frame (RMF)
    https://i2.cs.hku.hk/GraphicsGroup/publications/pdf/Computation%20of%20rotation%20minimizing%20frames.pdf

    inputs: - a tree node and its frame (source)
            - the delta vector for calculating the next node'
                 position and tangent vector (direction)
    output: a single normal vector

    note: the binormal is omitted here because, it can
          always be calculated from the tangent and the normal vectors
    */
    grow_rmf_normal(source, direction) {
        // inputs for frame 0
        const x0 = source.pos;
        const t0 = source.dir;
        const r0 = source.normal;
        // const s0 = source.binormal();

        // inputs for frame 1
        const x1 = source.pos.plus(direction);
        const t1 = direction.clone().normalize();

        // outputs for frame 1
        let r1 = 0;
        //let s1 = 0;

        // magic
        const v1 = x1.minus(x0);
        const c1 = v1.dot(v1);
        const rLi = r0.minus(v1.times((2/c1) * v1.dot(r0)));
        const tLi = t0.minus(v1.times((2/c1) * v1.dot(t0)));
        const v2 = t1.minus(tLi);
        const c2 = v2.dot(v2);
        r1 = rLi.minus(v2.times((2/c2) * (v2.dot(rLi))));
        // s1 = t1.cross(r1);

        return r1;
    }

    growFrom(source, direction) {
        // frenet frame
        // https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas
        // const acceleration_vector = direction.minus(source.dir).normalize();
        // const principal_normal = direction.cross(acceleration_vector).cross(direction);

        // rmf frame
        const principal_normal = this.grow_rmf_normal(source, direction);

        const angle = source.dir.dot(direction);

        const newNode = new TreeNode(
            source,
            source.pos.plus(direction.times(Math.pow(angle, 2)*BRANCH_LENGTH)),
            // source.pos.plus(direction.times(BRANCH_LENGTH)),
            direction,
            source.width*BRANCH_WIDTH_SCALE,
            principal_normal);
        source.children.push(newNode);
        this.nodes.push(newNode);
    }

    grow() {
        if (this.attractionPoints.length === 0 || this.nodes.length >= MAX_TREE_SIZE) {
            return;
        }

        console.log('tree size:', this.nodes.length, 'nodes');

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
                sumVect.add(inflNode.node.dir.times(PREVIOUS_DIR_POWER));
                sumVect.normalize();

                // add node
                this.growFrom(inflNode.node, sumVect);
            }
        }

        // remove consumed points
        this.removeReachedAttractionPoints();
    }
}