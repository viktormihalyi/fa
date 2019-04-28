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

        // twig modelmatrices
        // -------------------------------------------------------------------
        const twigs_model = this.tree.nodes
            .filter(node => node.width < 3 && node.children.length > 0)
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
