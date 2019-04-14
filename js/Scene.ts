const BG_COLOR = new Vec3(240,248,255).over(255);

class Scene {
    public gl: WebGL2RenderingContext;

    private timeAtFirstFrame: number;
    private timeAtLastFrame: number;

    private camera: PerspectiveCamera;
    private gameObjects: GameObject[];
    treem: Material;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        const tree = new Tree();
        tree.growFully();
        const avg = (arr: number[]) => {
            let sum = 0;
            for (const el of arr) {
                sum += el;
            }
            return sum / arr.length;
        }
        console.log(`max depth: ${Math.max(...tree.nodes.map(n => n.depth))}, avg depth: ${avg(tree.nodes.map(n => n.depth))}`);

        const treeShader = Program.from(gl, 'tree.vert', 'tree.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'tangent' },
            { position: 4, name: 'bitangent' },
        ]);
        const treeGeometry = new TreeGeometry(gl);
        treeGeometry.setPoints(tree);
        const treeMaterial = new Material(gl, treeShader);
        treeMaterial.treeTexture.set(new Texture2D(gl, `media/bark.jpg`));
        treeMaterial.treeTextureNorm.set(new Texture2D(gl, `media/bark_normal.jpg`));
        treeMaterial.treeTextureHeight.set(new Texture2D(gl, `media/bark_height.jpg`));
        treeMaterial.mossTexture.set(new Texture2D(gl, `media/mossy_rock.jpg`));
        treeMaterial.mossTextureNorm.set(new Texture2D(gl, `media/mossy_rock_normal.jpg`));
        treeMaterial.mossTextureHeight.set(new Texture2D(gl, `media/mossy_rock_height.jpg`));
        treeMaterial.mossyness.set(0.0);

        this.treem = treeMaterial;

        const treeObject = new GameObject(new Mesh(treeGeometry, treeMaterial));


        const leavesShader = Program.from(gl, 'leaves.vert', 'leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelM' },
        ]);

        const leafMaterial = new Material(gl, leavesShader);
        leafMaterial.leaves.set(new Texture2D(gl, `media/leaf01.jpg`));
        leafMaterial.leaves_alpha.set(new Texture2D(gl, `media/leaf01_alpha2.jpg`));
        leafMaterial.leaves_translucency.set(new Texture2D(gl, `media/leaf01_translucency.jpg`));

        const quadGeometry = new QuadGeometry(gl);
        const leavesGeometry = new InstancedGeometry(gl, quadGeometry, 3, true);
        const leavesObject = new GameObject(new Mesh(leavesGeometry, leafMaterial));

        const frenetShader = Program.from(gl, 'frenet.vert', 'frenet.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexColor' },
        ]);
        const frenetMaterial = new Material(gl, frenetShader);
        const frenetGeometry = new FrenetGeometry(gl);
        frenetGeometry.setPoints(tree);
        const frenetFrames = new GameObject(new Mesh(frenetGeometry, frenetMaterial));

        const twigShader = new Material(gl, Program.from(gl, 'twig.vert', 'twig.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'modelMatrix' },
        ]));
        const twigs = new InstancedGeometry(gl, new TwigGeometry(gl), 2, false);
        twigs.setModelMatrices([new Mat4().scale(new Vec3(1, 0.07, 1))]);


        class Twig {
            public position: Vec3;
            public tangent: Vec3;
            public normal: Vec3;
            public binormal: Vec3;
            public orientationMatrix: Mat4;
            public modelMatrix: Mat4;

            constructor(position: Vec3, treeTangent: Vec3, treeNormal: Vec3, i: number) {
                this.position = position;

                // make the twig stick out of the tree
                this.tangent = treeTangent.times(2).plus(treeNormal).normalize();

                this.binormal = this.tangent.cross(treeNormal).normalize();
                this.normal = this.tangent.cross(this.binormal).normalize();

                this.orientationMatrix = createOrientationMatrix(this.tangent, this.normal, this.binormal);
                this.modelMatrix = new Mat4()
                    .scale(randomBetweenFloat(0.02, 0.25))
                    .mul(this.orientationMatrix)
                    .rotate(rad(i*120 + randomBetween(-15, 15)), treeTangent)
                    .translate(this.position);
            }
        }

        const twigs_model = tree.nodes
            .filter(node => node.width < 3 && node.children.length > 0)
            .flatMap(node => {
                let agak = [];
                const leaf_count = randomBetween(2, 3);
                for (let i = 0; i < leaf_count; i++) {
                    agak.push(new Twig(node.parent!.pos, node.tangent, node.normal, i));
                }
                return agak;
            });

        console.log(`twig count: ${twigs_model.length}`);
        twigs.setModelMatrices(twigs_model.map(t => t.modelMatrix));

        const LEAF_SCALE = 100.0;
        leavesGeometry.setModelMatrices(
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
        console.log(`leaf count: ${twigs_model.length}`);

        this.gameObjects = [];
        this.gameObjects.push(treeObject);
        this.gameObjects.push(leavesObject);
        this.gameObjects.push(new GameObject(new Mesh(twigs, twigShader)));
        // this.gameObjects.push(frenetFrames);

        const testQuad = new Material(gl, Program.from(gl, 'quad.vert', 'quad.frag', [
            { position: 0, name: 'vertexPosition' }
        ]));

        const testQ = new GameObject(new Mesh(quadGeometry, testQuad));
        testQ.position = new Vec3(-250, 200, 0);
        testQ.orientation = radians(90);
        testQ.scale = new Vec3(1, 1, 1).times(50);

        // this.gameObjects.push(testQ);

        this.camera = new PerspectiveCamera();
    }

    update(gl: WebGL2RenderingContext, keysPressed: any): void {

        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        // clear the screen
        gl.clearColor(BG_COLOR.x, BG_COLOR.y, BG_COLOR.z, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // update camera
        this.camera.move(dt, keysPressed);

        Uniforms.camera.viewProj.set(this.camera.viewProjMatrix);
        Uniforms.camera.wEye.set(this.camera.position);
        Uniforms.camera.wLiPos.set(new Vec3(Math.cos(t/2)*300, 500, Math.sin(t/2)*300));

        if (keysPressed.SPACE) {
            this.camera.position.set(Uniforms.camera.wLiPos);
        }

        // draw objects
        for (const obj of this.gameObjects) {
            obj.draw();
        }
    }

    onresize(width: number, height: number): void {
        this.camera.setAspectRatio(width / height);
    }

    onmousedown(): void {
        this.camera.mouseDown();
    }
    onmousemove(event: MouseEvent): void {
        this.camera.mouseMove(event);
    }
    onmouseup(): void {
        this.camera.mouseUp();
    };
}



