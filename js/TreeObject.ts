const GROW_INCREMENTALLY = false;

class TreeObject {
    private gl: WebGL2RenderingContext;

    private isFinished: boolean = false;
    private tree: Tree;

    private treeGeometry: TreeGeometry;
    private twigsGeometry: InstancedGeometry;
    private leavesGeometry: InstancedGeometry;
    private frenetGeometry: FrenetGeometry;
    private spheres: InstancedGeometry;

    private gameObjects: GameObject[];

    public scale: number;
    public position: Vec3;
    public orientation: number;
    public orientationVector: Vec3;
    private modelMatrix: Mat4;

    private lastGrowth: number;

    constructor(gl: WebGL2RenderingContext,
                treeMaterial: Material, leafMaterial: Material, twigMaterial: Material,
                frenetMaterial: Material,
                treeMaterialDepth: Material, leafMaterialDepth: Material, twigMaterialDepth: Material, sphereMaterial: Material) {

        this.gl = gl;
        this.tree = new Tree();

        this.scale = 1;
        this.position = new Vec3(0, 0, 0);
        this.orientation = 0;
        this.orientationVector = new Vec3();
        this.modelMatrix = new Mat4();

        this.spheres = new InstancedGeometry(gl, new SphereGeometry(gl), 3, false);
        this.treeGeometry = new TreeGeometry(gl);
        this.twigsGeometry = new InstancedGeometry(gl,  new TwigGeometry(gl), 3, false);
        this.leavesGeometry = new InstancedGeometry(gl, new QuadGeometry(gl), 3, true);
        this.frenetGeometry = new FrenetGeometry(gl);

        this.gameObjects = [];
        this.gameObjects.push(new GameObject(new Mesh(this.treeGeometry, treeMaterial, treeMaterialDepth)));
        this.gameObjects.push(new GameObject(new Mesh(this.leavesGeometry, leafMaterial, leafMaterialDepth)));
        this.gameObjects.push(new GameObject(new Mesh(this.twigsGeometry, twigMaterial, twigMaterialDepth)));
        // this.gameObjects.push(new GameObject(new Mesh(this.frenetGeometry, frenetMaterial)));

        if (GROW_INCREMENTALLY) {
            this.gameObjects.push(new GameObject(new Mesh(this.spheres, sphereMaterial, twigMaterialDepth)));
        }

        this.lastGrowth = Date.now();
        this.init();
    }

    private updateModelMatrix(): void {
        this.modelMatrix.set()
            .scale(this.scale)
            .rotate(this.orientation, this.orientationVector)
            .translate(this.position);
    }

    private updateGeometries() {
        this.treeGeometry.setPoints(this.tree);

        if (GROW_INCREMENTALLY) {
            this.spheres.setModelMatrices(this.tree.attractionPoints.map(p => new Mat4().scale(2).translate(p)));
        }

        let tree_width_avg = 0;
        for (let node of this.tree.nodes) {
            tree_width_avg += node.width;
        }
        tree_width_avg /= this.tree.nodes.length;

        let mean = (Math.min(...this.tree.nodes.map(n => n.width)) + Math.max(...this.tree.nodes.map(n => n.width))) / 2;
        let width_at_first_bif = -1;

        this.tree.traverse_from_root((node: TreeNode): void => {
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
                const leaf_count = randomBetween(2, 4);
                for (let i = 0; i < leaf_count; i++) {
                    agak.push(new Twig(node.parent!.pos, node.tangent, node.normal, i));
                }
                return agak;
            });

        this.twigsGeometry.setModelMatrices(twigs_model.map(t => t.modelMatrix));

        // leaf modelmatrices
        // -------------------------------------------------------------------
        this.leavesGeometry.setModelMatrices(
            twigs_model
                .map(m => {
                    const leaf_scale = randomBetween(90, 175);
                    return new Mat4()
                        .scale(leaf_scale)
                        .rotate(rad(-13))
                        .translate(0, leaf_scale * 1.5, 0)
                        .mul(m.modelMatrix)
                })
        );

        this.frenetGeometry.setPoints(this.tree);
    }

    public init() {
        this.tree.init();
        if (!GROW_INCREMENTALLY) {
            this.tree.growFully();
        }
        this.updateGeometries();
    }

    public draw(depth: boolean = false) {
        this.updateModelMatrix();
        Uniforms.camera.modelMatrix.set(this.modelMatrix);

        if (GROW_INCREMENTALLY) {
            const t = Date.now();
            if (t - this.lastGrowth > 250) {
                const sc = this.tree.grow();
                if (sc) {
                    this.tree.calculate_depth();
                    this.updateGeometries();
                    this.lastGrowth = t;
                } else {
                    if (!this.isFinished) {
                        this.isFinished = true;
                        this.tree.finishTree();
                        this.updateGeometries();
                        this.spheres.setModelMatrices([]);
                    }
                }
            }
        }

        for (let i = 0; i < this.gameObjects.length; i++) {
            this.gameObjects[i].draw(depth, false);
        }
    }
}
