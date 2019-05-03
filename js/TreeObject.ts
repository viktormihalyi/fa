class TreeObject {
    private gl: WebGL2RenderingContext;

    private tree: Tree;

    private treeGeometry: TreeGeometry;
    private twigsGeometry: InstancedGeometry;
    private leavesGeometry: InstancedGeometry;
    private frenetGeometry: FrenetGeometry;

    private gameObjects: GameObject[];

    public scale: number;
    public position: Vec3;
    public orientation: number;
    public orientationVector: Vec3;
    private modelMatrix: Mat4;

    constructor(gl: WebGL2RenderingContext,
                treeMaterial: Material, leafMaterial: Material, twigMaterial: Material,
                frenetMaterial: Material,
                treeMaterialDepth: Material, leafMaterialDepth: Material, twigMaterialDepth: Material) {

        this.gl = gl;
        this.tree = new Tree();

        this.scale = 1;
        this.position = new Vec3(0, 0, 0);
        this.orientation = 0;
        this.orientationVector = new Vec3();
        this.modelMatrix = new Mat4();

        this.treeGeometry = new TreeGeometry(gl);
        this.twigsGeometry = new InstancedGeometry(gl,  new TwigGeometry(gl), 3, false);
        this.leavesGeometry = new InstancedGeometry(gl, new QuadGeometry(gl), 3, true);
        this.frenetGeometry = new FrenetGeometry(gl);

        this.gameObjects = [];
        this.gameObjects.push(new GameObject(new Mesh(this.treeGeometry, treeMaterial, treeMaterialDepth)));
        this.gameObjects.push(new GameObject(new Mesh(this.leavesGeometry, leafMaterial, leafMaterialDepth)));
        this.gameObjects.push(new GameObject(new Mesh(this.twigsGeometry, twigMaterial, twigMaterialDepth)));
        // this.objects.push(new GameObject(new Mesh(this.frenetGeometry, frenetMaterial)));

        this.init();
    }

    private updateModelMatrix(): void {
        this.modelMatrix.set()
            .scale(this.scale)
            .rotate(this.orientation, this.orientationVector)
            .translate(this.position);
    }

    public init() {
        this.tree.regrow();

        this.treeGeometry.setPoints(this.tree);

        let tree_width_avg = 0;
        for (let node of this.tree.nodes) {
            tree_width_avg += node.width;
        }
        tree_width_avg /= this.tree.nodes.length;

        let mean = (Math.min(...this.tree.nodes.map(n => n.width)) + Math.max(...this.tree.nodes.map(n => n.width))) / 2;
        let width_at_first_bif = -1;

        function traverse_tree(root: TreeNode, callback: (node: TreeNode) => void): void {
            callback(root);
            for (const child of root.children) {
                traverse_tree(child, callback);
            }
        }

        traverse_tree(this.tree.nodes[0], function(node: TreeNode): void {
            if (width_at_first_bif === -1 && node.children.length > 1) {
                width_at_first_bif = node.width;
            }
        });
        console.log(`tree width avg: ${tree_width_avg}, mean: ${mean}, at_first_bif: ${width_at_first_bif}`);

        const PUT_LEAVES_ON_NODE = (node: TreeNode): boolean => {
            return node.width < width_at_first_bif && node.children.length > 0;
        };

        // twig modelmatrices
        // -------------------------------------------------------------------
        const twigs_model = this.tree.nodes
            .filter(PUT_LEAVES_ON_NODE)
            .flatMap(node => {
                let agak = [];
                const leaf_count = randomBetween(2, 3);
                for (let i = 0; i < leaf_count; i++) {
                    agak.push(new Twig(node.parent!.pos, node.tangent, node.normal, i));
                }
                return agak;
            });

        this.twigsGeometry.setModelMatrices(twigs_model.map(t => t.modelMatrix));

        // leaf modelmatrices
        // -------------------------------------------------------------------
        const LEAF_SCALE = 100.0;
        this.leavesGeometry.setModelMatrices(
            twigs_model
                .map(m => new Mat4()
                    .scale(LEAF_SCALE)
                    // rotate
                        // .translate(new Vec3(0, 0.5*LEAF_SCALE, 0))
                        // .rotate(rad(90), m.tangent)
                        // .translate(new Vec3(0, -0.5*LEAF_SCALE, 0))
                    .rotate(rad(-13))
                    .translate(new Vec3(0, LEAF_SCALE*1.6, 0))
                    .mul(m.modelMatrix)
                )
        );

        this.frenetGeometry.setPoints(this.tree);
    }

    public draw(depth: boolean = false) {
        this.updateModelMatrix();
        Uniforms.camera.modelMatrix.set(this.modelMatrix);

        for (let i = 0; i < this.gameObjects.length; i++) {
            this.gameObjects[i].draw(depth, false);
        }
    }
}
