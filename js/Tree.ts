// http://algorithmicbotany.org/papers/colonization.egwnp2007.large.pdf
const LOG_GROWTH = false;
class Tree {
    public nodes: TreeNode[];
    public attractionPoints: Vec3[];
    public growthCount: number;
    private config: TreeConfig;

    constructor() {
        this.nodes = [];
        this.attractionPoints = [];
        this.growthCount = 0;
        this.config = new TreeConfig();
    }

    public init(): void {
        this.config.generate();

        this.growthCount = 0;

        this.nodes = [];
        this.attractionPoints = [];

        // setup starting tree - just one one
        this.nodes.push(new TreeNode(
            null, // parent
            this.config.TREE_INITIAL_POS,
            this.config.TREE_INITIAL_DIRECTION,
            this.config.TREE_STARTING_WIDTH,
            this.config.TREE_INITIAL_NORMAL,
            this.config.BRANCH_LENGTH));

        // generate attraction points
        const max_x = this.config.CIRCLE_CENTER.x + this.config.CIRCLE_RADIUS;
        const min_x = this.config.CIRCLE_CENTER.x - this.config.CIRCLE_RADIUS;
        const max_y = this.config.CIRCLE_CENTER.y + this.config.CIRCLE_RADIUS;
        const min_y = this.config.CIRCLE_CENTER.y - this.config.CIRCLE_RADIUS;
        const max_z = this.config.CIRCLE_CENTER.z + this.config.CIRCLE_RADIUS;
        const min_z = this.config.CIRCLE_CENTER.z - this.config.CIRCLE_RADIUS;

        while (this.attractionPoints.length < this.config.ATTRACTION_POINT_COUNT) {
            const rndpoint = new Vec3(
                randomBetween(min_x, max_x),
                randomBetween(min_y, max_y),
                randomBetween(min_z, max_z));

            if (this.good_point(rndpoint)) {
                this.attractionPoints.push(rndpoint);
            }
        }
    }
    public growFully(callback?: () => void): void {
        for (let i = 0; i < this.config.GROW_ITERATIONS; i++) {
            this.grow();
            if (callback) {
                callback();
            }
        }
        console.log(`growing for ${this.config.GROW_ITERATIONS} resulted in ${this.nodes.length} nodes`);
        this.finishTree();
    }

    public finishTree() {
        // this.spline(1);
        this.add_ends();
        this.calculate_depth();
    }

    calculate_depth(): void {
        // set v coordinates for textures
        const recursive_set_v = (root: TreeNode, n: number) => {
            root.depth = n;
            for (const child of root.children) {
                const dist_to_parent = child.pos.minus(root.pos).length();
                recursive_set_v(child, n + dist_to_parent/this.config.BRANCH_LENGTH);
            }
        }
        recursive_set_v(this.nodes[0], 0);
    }

    // return a new node
    // parent is null
    static interpolate_node_between(nodeA: TreeNode, nodeB: TreeNode, t: number): TreeNode {
        const prev = nodeA.parent || nodeA;
        const grandchild = nodeB.getDominantChild() || nodeB;

        const interpolated_pos    = catmull_rom_spline(prev.pos,    nodeA.pos,    nodeB.pos,    grandchild.pos,    t);
        const interpolated_dir    = catmull_rom_spline(prev.tangent,    nodeA.tangent,    nodeB.tangent,    grandchild.tangent,    t);
        const interpolated_normal = catmull_rom_spline(prev.normal, nodeA.normal, nodeB.normal, grandchild.normal, t);

        return new TreeNode(null, interpolated_pos, interpolated_dir, lerp(nodeA.width, nodeB.width, t), interpolated_normal, lerp(nodeA.branch_length, nodeB.branch_length, t));
    }

    remove_intersecting_nodes(rougness = 1): void {
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
    spline(mennyit: number): void {

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

    good_point(pos: Vec3): boolean {
        return Math.pow((pos.x - this.config.CIRCLE_CENTER.x) / this.config.CIRCLE_RADIUS, 2) +
               Math.pow((pos.y - this.config.CIRCLE_CENTER.y) / this.config.CIRCLE_RADIUS * this.config.FLATNESS, 2) +
               Math.pow((pos.z - this.config.CIRCLE_CENTER.z) / this.config.CIRCLE_RADIUS, 2) <= 1;
    }

    // keep only the attraction points which are further
    // away than a specific distance from all tree nodes
    private removeReachedAttractionPoints(): void {
        this.attractionPoints = this.attractionPoints.filter((e) => {
            // search for the closest tree node's distance
            let closestDist = Number.MAX_SAFE_INTEGER;
            for (let treeNode of this.nodes) {
                this._helpervec3.setDifference(treeNode.pos, e);
                let dist = this._helpervec3.length();
                if (dist < closestDist) {
                    closestDist = dist;
                }
            }
            return closestDist >= this.config.INFL_MIN_DIST;
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
    static grow_rmf_normal(source: TreeNode, direction: Vec3): Vec3 {
        // inputs for frame 0
        const x0 = source.pos;
        const t0 = source.tangent;
        const r0 = source.normal;
        // const s0 = source.binormal();

        // inputs for frame 1
        const x1 = source.pos.plus(direction);
        const t1 = direction; //.clone().normalize();

        // outputs for frame 1
        let r1: Vec3;
        // let s1: Vec3;

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

    static grow_rmf_normal_raw(pos: Vec3, dir: Vec3, normal: Vec3, direction: Vec3): Vec3 {
        return Tree.grow_rmf_normal({pos, tangent: dir, normal} as TreeNode, direction);
    }

    private growFrom(source: TreeNode, direction: Vec3): void {
        // frenet frame
        // https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas
        // const acceleration_vector = direction.minus(source.dir).normalize();
        // const principal_normal = direction.cross(acceleration_vector).cross(direction);

        // rmf frame
        const principal_normal = Tree.grow_rmf_normal(source, direction);

        const angle = source.tangent.dot(direction);

        const newNode = new TreeNode(
            source,
            source.pos.plus(direction.times(source.branch_length)),
            direction,
            source.width*this.config.BRANCH_WIDTH_SCALE,//*angle,
            principal_normal,
            source.branch_length * this.config.BRANCH_LENGTH_SCALE);

        // TODO fix growing on the same position?
        for (const n of this.nodes) {
            if (n.pos.minus(newNode.pos).length() < 0.01) {
                console.log('wtf')
                return;
            }
        }

        source.children.push(newNode);
        this.nodes.push(newNode);
    }

    private _helpervec3 = new Vec3();
    private dist_to_node(pos: Vec3, node: TreeNode): number {
        this._helpervec3.setDifference(node.pos, pos);
        return this._helpervec3.length();
    }

    private add_ends(): void {
        for (const node of this.nodes.filter(n => n.children.length === 0)) {
            const ending_node_pos = node.pos.plus(node.tangent.times(this.config.BRANCH_LENGTH*0.05));
            const endingNode = new TreeNode(node, ending_node_pos, node.tangent, node.width/2, node.normal, node.branch_length/2);
            node.children.push(endingNode);
            this.nodes.push(endingNode);
        }
    }

    public traverse_from_root(callback: (node: TreeNode) => void) {
        this.traverse_tree(this.nodes[0], callback);
    }

    private traverse_tree(root: TreeNode, callback: (node: TreeNode) => void): void {
        callback(root);
        for (const child of root.children) {
            this.traverse_tree(child, callback);
        }
    }

    public grow(): boolean {
        if (this.attractionPoints.length <= this.config.ATTRACTION_POINT_COUNT*0.1 // 90% is enough
            || this.nodes.length >= this.config.MAX_TREE_SIZE
            || this.growthCount >= this.config.GROW_ITERATIONS) {
            return false;
        }
        const start = Date.now();
        if (LOG_GROWTH) {
            console.log(`attrs left: ${this.attractionPoints.length}/${this.config.ATTRACTION_POINT_COUNT}, tree size: ${this.nodes.length}/${this.config.MAX_TREE_SIZE}, growth: ${this.growthCount}/${this.config.GROW_ITERATIONS}`)
        }

        this.growthCount++;

        let influencedNodes: {node: TreeNode, attrs: Vec3[]}[];
        influencedNodes = this.nodes.map(node => ({node: node, attrs: []}));

        // find closest node to each attraction point
        let found = false;
        for (const apoint of this.attractionPoints) {
            let closest: TreeNode|null  = null;
            let closestDist = Number.MAX_SAFE_INTEGER;

            for (const treeNode of this.nodes) {
                let dist = this.dist_to_node(apoint, treeNode);
                if (dist < closestDist && this.config.INFL_MIN_DIST < dist && dist < this.config.INFL_MAX_DIST) {
                    closest = treeNode;
                    closestDist = dist;
                }
            }

            if (closest !== null) {
                found = true;
                let node_closest_to_attr = influencedNodes.find((n) => n.node === closest)!;
                assert(node_closest_to_attr !== null, '');
                node_closest_to_attr.attrs.push(apoint);
            }
        }

        // grow tree
        if (!found) {
            // no attraction at all, just grow up
            const lastNode = this.nodes[this.nodes.length - 1];
            this.growFrom(lastNode, lastNode.tangent);

        } else {
            // grow according to attractions
            for (const inflNode of influencedNodes) {
                // ignore those tree nodes that have no attraction
                if (inflNode.attrs.length === 0) {
                    continue;
                }

                // attraction points whose closest node is the current one
                let attrs = influencedNodes.find((n) => n.node === inflNode.node)!.attrs;

                // sum up all attrpoint-node directions
                let sumVect = new Vec3(0, 0, 0);
                for (const apoint of attrs) {
                    // sumVect.add(apoint.minus(inflNode.node.pos).normalize());

                    // the 2 are the same
                    // sumVect.add(apoint.minus(inflNode.node.pos));
                    sumVect.add(apoint);
                    sumVect.sub(inflNode.node.pos);
                }
                sumVect.normalize();
                // also include the previous direction
                sumVect.add(inflNode.node.tangent.times(this.config.PREVIOUS_DIR_POWER));
                sumVect.normalize();

                // add node
                this.growFrom(inflNode.node, sumVect);
            }
        }

        // remove consumed points
        this.removeReachedAttractionPoints();

        if (LOG_GROWTH) {
            const end = Date.now();
            const start_end_diff = end - start;
            console.log(`growing took ${start_end_diff} ms`);
        }

        return true;
    }
}