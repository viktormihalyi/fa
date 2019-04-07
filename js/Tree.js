"use strict";

Math.seedrandom(7);

// number of attraction points to generate
const ATTRACTION_POINT_COUNT = 250*6;

// attraction points generation around a circle
const CIRCLE_CENTER = new Vec3(0, 250, 0);
const CIRCLE_RADIUS = 120;

// space colonization algorithm constants
const INFL_MIN_DIST = 12;
const INFL_MAX_DIST = 150;
const BRANCH_LENGTH = 30;
const BRANCH_LENGTH_SCALE = 0.97;

// starting tree node values
const TREE_INITIAL_POS = new Vec3(0, 0, 0);
const TREE_INITIAL_DIRECTION = new Vec3(0, 1, 0);
const TREE_INITIAL_NORMAL = new Vec3(0, 0, 1);
const TREE_STARTING_WIDTH = 12;

// stop grwoing after reaching this many tree nodes
const MAX_TREE_SIZE = 250;

// how much the previous growing direction should affect the next node
// 0 - not taken into consideration
const PREVIOUS_DIR_POWER = 0.75;

// width scales with each node
const BRANCH_WIDTH_SCALE = 0.82;


class TreeNode {
    constructor(parent, pos, dir, width, normal, br) {
        this.parent = parent;
        this.pos = pos;
        this.dir = dir.clone().normalize();
        this.width = width;
        this.children = [];
        this.normal = normal.clone().normalize();
        this.branch_length = br;
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

    clone() {
        return new TreeNode(null, this.pos, this.dir, this.width, this.normal, this.br);
    }

    opposite() {
        return new TreeNode(null, this.pos, this.dir.times(-1), this.width, this.normal.times(-1), this.br);
    }

    getOrientationMatrix() {
        return createOrientationMatrix(this.dir, this.normal, this.binormal());
    }
}

// http://algorithmicbotany.org/papers/colonization.egwnp2007.large.pdf
class Tree {
    constructor() {
        this.nodes = [];
        this.attractionPoints = [];
        this.middleNodes = [];
        this.ending_nodes = [];

        // setup starting tree - just one one
        this.nodes.push(new TreeNode(
            null, // parent
            TREE_INITIAL_POS,
            TREE_INITIAL_DIRECTION,
            TREE_STARTING_WIDTH,
            TREE_INITIAL_NORMAL,
            BRANCH_LENGTH));

        // generate attraction points
        while (this.attractionPoints.length < ATTRACTION_POINT_COUNT) {
            const rndpoint = new Vec3(
                randomBetween(-1000, 1000),
                randomBetween(50, 1000),
                randomBetween(-1000, 1000));

            if (this.good_point(rndpoint)) {
                this.attractionPoints.push(rndpoint);
            }
        }
    }

    // return a new node
    // parent is null
    static interpolate_node_between(nodeA, nodeB, t) {
        const prev = nodeA.parent || nodeA;
        const grandchild = nodeB.getDominantChild() || nodeB;

        const interpolated_pos    = catmull_rom_spline(prev.pos,    nodeA.pos,    nodeB.pos,    grandchild.pos,    t);
        const interpolated_dir    = catmull_rom_spline(prev.dir,    nodeA.dir,    nodeB.dir,    grandchild.dir,    t);
        const interpolated_normal = catmull_rom_spline(prev.normal, nodeA.normal, nodeB.normal, grandchild.normal, t);

        return new TreeNode(null, interpolated_pos, interpolated_dir, lerp(nodeA.width, nodeB.width, t), interpolated_normal, lerp(nodeA.branch_length, nodeB.branch_length, t));
    }

    add_middle_spline() {
        for (const s of this.middleNodes) {
            this.nodes.splice(this.nodes.indexOf(s), 1);
        }
        this.middleNodes = [];

        for (const node of this.nodes) {
            if (node.children.length === 2) {
                const childA = node.children[0];
                const childB = node.children[1];

                const middle_point = node.pos
                                    .plus(childA.pos.times(2))
                                    .plus(childB.pos.times(2))
                                    .over(5);

                const a_to_b_normal = childB.pos.minus(childA.pos).normalize();
                const b_to_a_normal = childA.pos.minus(childB.pos).normalize();

                const childA_opposite = childA.opposite();
                const childB_opposite = childB.opposite();

                const middle_width = (childA.width + childB.width) / 2.1;
                const middle_normal = Tree.grow_rmf_normal_raw(childA.pos, childA.dir.times(-1), childA.normal.times(-1), a_to_b_normal);
                const middle_normalb = Tree.grow_rmf_normal_raw(childB.pos, childB.dir.times(-1), childB.normal.times(-1), b_to_a_normal);

                {
                    const middle_node = new TreeNode(childA_opposite, middle_point, a_to_b_normal, middle_width, middle_normal, childA.branch_length);

                    const bcopy = childB.clone();

                    childA_opposite.children.push(middle_node);
                    middle_node.children.push(bcopy);
                    bcopy.parent = middle_node;

                    this.nodes.push(childA_opposite);
                    this.nodes.push(middle_node);
                    this.nodes.push(bcopy);

                    this.middleNodes.push(childA_opposite);
                    this.middleNodes.push(middle_node);
                    this.middleNodes.push(bcopy);
                }
                if (false)
                {
                    const middle_node = new TreeNode(childB_opposite, middle_point, b_to_a_normal, middle_width, middle_normalb);

                    childB_opposite.children.push(middle_node);

                    this.nodes.push(childB_opposite);
                    this.nodes.push(middle_node);

                    this.middleNodes.push(childB_opposite);
                    this.middleNodes.push(middle_node);
                }

            }
        }
    }

    remove_intersecting_nodes(rougness = 1) {
        const bifurcation_nodes = this.nodes.filter(node => node.children.length > 1);

        let removed_count = 0;

        for (const node of bifurcation_nodes) {

            let children_are_intersecting = true;
            while (children_are_intersecting) {
                const child0 = node.children[0];
                const child1 = node.children[1];

                const distance = child0.pos.minus(child1.pos).length() / rougness;
                children_are_intersecting = distance < child0.width + child1.width;

                if (children_are_intersecting) {
                    removed_count++;

                    const next_child0 = child0.children[0];
                    const next_child1 = child1.children[0];

                    assert(child0.children.length === 1, 'not one child');
                    assert(child1.children.length === 1, 'not one child');

                    assert(next_child0 !== null, 'no next child for 0');
                    assert(next_child1 !== null, 'no next child for 1');

                    this.nodes.splice(this.nodes.indexOf(child0), 1);
                    this.nodes.splice(this.nodes.indexOf(child1), 1);

                    node.children.splice(node.children.indexOf(child0), 1);
                    node.children.splice(node.children.indexOf(child1), 1);

                    node.children.push(next_child0);
                    node.children.push(next_child1);

                    next_child0.parent = node;
                    next_child1.parent = node;
                }
            }
        }
    }


    // - interpolates the tree nodes with splines
    // - currently uses the centripetal catmull rom splnie
    // - the argument means how many extra nodes
    //   we want to insert between 2 nodes
    spline(mennyit) {

        let allSplines = [];

        for (let node of this.nodes) {
            for (let child of node.children) {

                // nodes between node and child
                // first node is closest to 'node'
                // last node is closest to 'child'
                // inside, their parent-children relationship will be set
                let newLine = [];

                // spline between node (from) and child (to)
                for (let j = 1; j <= mennyit; j++) {
                    const t = j / (mennyit + 1);

                    const newNode = Tree.interpolate_node_between(node, child, t);
                    newLine.push(newNode);
                }

                for (let j = 0; j < newLine.length - 1; j++) {
                    let n = newLine[j];
                    let nchild = newLine[j+1];

                    n.children.push(nchild);
                    nchild.parent = n;
                }

                allSplines.push({
                    node,   // parent
                    child,  // child
                    line: newLine, // array of the nodes
                });
            }
        }

        // connect all splines to the existing tree structure
        for (let spline of allSplines) {
            let node = spline.node;
            let child = spline.child;

            // reset node and child relationships
            child.parent = null;
            node.children.splice(node.children.indexOf(child), 1);

            let first_node_on_line = spline.line[0];
            let last_node_on_line = spline.line[spline.line.length-1];

            // connect the first node on the spline to 'node'
            node.children.push(first_node_on_line);
            first_node_on_line.parent = node;

            // connect the last node on the spline to 'child'
            last_node_on_line.children.push(child);
            child.parent = last_node_on_line;

            this.nodes.push(...spline.line);
        }
    }

    good_point(pos) {
        const a = CIRCLE_RADIUS*2;
        const b = CIRCLE_RADIUS*1;
        const c = CIRCLE_RADIUS*2;
        return Math.pow((pos.x-CIRCLE_CENTER.x) / a, 2) +
            Math.pow((pos.y-CIRCLE_CENTER.y) / b, 2) +
            Math.pow((pos.z-CIRCLE_CENTER.z) / c, 2) <= 1;
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

    note: the binormal is omitted here because it can
          always be calculated from the tangent and the normal vectors
    */
    static grow_rmf_normal(source, direction) {
        // inputs for frame 0
        const x0 = source.pos;
        const t0 = source.dir;
        const r0 = source.normal;
        // const s0 = source.binormal();

        // inputs for frame 1
        const x1 = source.pos.plus(direction);
        const t1 = direction; //.clone().normalize();

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

    static grow_rmf_normal_raw(pos, dir, normal, direction) {
        return Tree.grow_rmf_normal({pos, dir, normal}, direction);
    }

    // grow_from_no(source, direction) {
    //     const principal_normal = Tree.grow_rmf_normal(source, direction);

    //     const angle = source.dir.dot(direction);

    //     return new TreeNode(
    //         source,
    //         source.pos.plus(direction.times(BRANCH_LENGTH)),
    //         direction,
    //         source.width*BRANCH_WIDTH_SCALE*Math.pow(angle, 0.0),
    //         principal_normal);
    // }

    growFrom(source, direction) {
        // frenet frame
        // https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas
        // const acceleration_vector = direction.minus(source.dir).normalize();
        // const principal_normal = direction.cross(acceleration_vector).cross(direction);

        // rmf frame
        const principal_normal = Tree.grow_rmf_normal(source, direction);

        const angle = source.dir.dot(direction);

        const newNode = new TreeNode(
            source,
            source.pos.plus(direction.times(source.branch_length)),
            direction,
            source.width*BRANCH_WIDTH_SCALE*Math.pow(angle, 0.0),
            principal_normal,
            source.branch_length * BRANCH_LENGTH_SCALE);

        // TODO fix growing on the same position?
        for (const n of this.nodes) {
            if (n.pos.minus(newNode.pos).length() < 0.1) {
                return;
            }
        }

        source.children.push(newNode);
        this.nodes.push(newNode);
    }

    dist_to_node(pos, node) {
        return node.pos.minus(pos).length();
    }

    add_ends() {
        for (const node of this.nodes.filter(n => n.children.length === 0)) {
            const ending_node_pos = node.pos.plus(node.dir.times(BRANCH_LENGTH*0.05));
            const endingNode = new TreeNode(node, ending_node_pos, node.dir, node.width/2, node.normal, node.branch_length/2);
            node.children.push(endingNode);
            this.nodes.push(endingNode);
            this.ending_nodes.push(endingNode);
        }
    }

    grow() {
        if (this.attractionPoints.length === 0 || this.nodes.length >= MAX_TREE_SIZE) {
            return;
        }

        let influencedNodes = this.nodes.map(node => ({node: node, attrs: []}));

        // find closest node to each attraction point
        let found = false;
        for (let apoint of this.attractionPoints) {

            let closest = null;
            let closestDist = Number.MAX_SAFE_INTEGER;
            for (let treeNode of this.nodes) {

                // only allow 2 children max
                if (treeNode.children.length >= 2) {
                    // continue;
                }

                let dist = this.dist_to_node(apoint, treeNode);
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