const BG_COLOR = new Vec3(240,248,255).over(255);

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


class Scene {
    public gl: WebGL2RenderingContext;

    // time
    private timeAtFirstFrame: number;
    private timeAtLastFrame: number;

    private camera: PerspectiveCamera;
    private gameObjects: GameObject[];

    private depthTexture: WebGLTexture;
    private fb: WebGLFramebuffer;

    private lightPos: Vec3;
    private lightLookat: Vec3;
    private fullScreenQuad: GameObject;
    private treeObj: GameObject;

    // shaders
    private depthShader?: Program;
    private instancedDepthShader?: Program;
    private leavesDepthShader?: Program;

    private treeShader?: Program;
    private leavesShader?: Program;
    private fquadShader?: Program;
    private frenetShader?: Program;
    private twigShader?: Program;
    private groundShader?: Program;

    // materials
    private depthMaterial: Material;
    private intancedDepthMaterial: Material;
    public treem: Material;
    leavesDepthMaterial: Material;

    initShaders() {
        console.log('compiling and linking shaders');
        const gl = this.gl;

        this.depthShader = Program.from(gl, 'depth.vert', 'depth.frag', [
            { position: 0, name: 'vertexPosition' },
        ]);

        this.instancedDepthShader = Program.from(gl, 'depth_instanced.vert', 'depth.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 3, name: 'modelMatrix' },
        ]);

        this.leavesDepthShader = Program.from(gl, 'depth_instanced.vert', 'depth_leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelMatrix' },
        ]);

        this.treeShader = Program.from(gl, 'tree.vert', 'tree.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'tangent' },
            { position: 4, name: 'bitangent' },
        ]);

        this.leavesShader = Program.from(gl, 'leaves.vert', 'leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelMatrix' },
        ]);

        this.fquadShader = Program.from(gl, 'fquad.vert', 'fquad.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
        ]);

        this.frenetShader = Program.from(gl, 'frenet.vert', 'frenet.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexColor' },
        ]);

        this.twigShader = Program.from(gl, 'twig.vert', 'twig.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 3, name: 'modelMatrix' },
        ]);

        this.groundShader = Program.from(gl, 'ground.vert', 'ground.frag', [
            { position: 0, name: 'vertexPosition' }
        ]);
    }

    constructor(gl: WebGL2RenderingContext, app: App) {
        this.gl = gl;
        this.initShaders();


        // time
        // -------------------------------------------------------------------
        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;


        // opengl settings
        // -------------------------------------------------------------------
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(BG_COLOR.x, BG_COLOR.y, BG_COLOR.z, 1);
        gl.clearDepth(1.0);


        // create depth texture
        // -------------------------------------------------------------------
        console.log('creating texture for depth buffer');
        const targetTextureWidth = app.canvas.clientWidth;
        const targetTextureHeight = app.canvas.clientHeight;
        this.depthTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, targetTextureWidth, targetTextureHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        // create depth buffer
        // -------------------------------------------------------------------
        console.log('creating depth framebuffer');
        this.fb = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        this.depthMaterial = new Material(gl, this.depthShader!);
        this.intancedDepthMaterial = new Material(gl, this.instancedDepthShader!);
        this.leavesDepthMaterial = new Material(gl, this.leavesDepthShader!);


        // tree
        // -------------------------------------------------------------------
        console.log('creating tree');
        const tree = new Tree();
        tree.growFully();

        const treeGeometry = new TreeGeometry(gl);
        treeGeometry.setPoints(tree);
        const treeMaterial = new Material(gl, this.treeShader!);
        treeMaterial.treeTexture.set(new Texture2D(gl, 'media/bark.jpg'));
        treeMaterial.treeTextureNorm.set(new Texture2D(gl, 'media/bark_normal.jpg'));
        treeMaterial.treeTextureHeight.set(new Texture2D(gl, 'media/bark_height.jpg'));
        treeMaterial.mossTexture.set(new Texture2D(gl, 'media/mossy_rock.jpg'));
        treeMaterial.mossTextureNorm.set(new Texture2D(gl, 'media/mossy_rock_normal.jpg'));
        treeMaterial.mossTextureHeight.set(new Texture2D(gl, 'media/mossy_rock_height.jpg'));
        treeMaterial.mossyness.set(1.75);
        treeMaterial.depthTexture.set(this.depthTexture);

        this.treem = treeMaterial;
        this.treem.rendermode.set(0);
        console.log(treeMaterial);

        const treeObject = new GameObject(new Mesh(treeGeometry, treeMaterial, this.depthMaterial));


        // leaves
        // -------------------------------------------------------------------
        console.log('creating leaves');
        const leafMaterial = new Material(gl, this.leavesShader!);
        leafMaterial.leaves.set(new Texture2D(gl, `media/leaf01.jpg`));
        const leaves_alpha_texture = new Texture2D(gl, `media/leaf01_alpha.jpg`);
        this.leavesDepthMaterial.leaves_alpha.set(leaves_alpha_texture);
        leafMaterial.leaves_alpha.set(leaves_alpha_texture);
        leafMaterial.leaves_translucency.set(new Texture2D(gl, `media/leaf01_translucency.jpg`));
        leafMaterial.depthTexture.set(this.depthTexture);

        const quadGeometry = new QuadGeometry(gl);
        const leavesGeometry = new InstancedGeometry(gl, quadGeometry, 3, true);
        const leavesObject = new GameObject(new Mesh(leavesGeometry, leafMaterial, this.leavesDepthMaterial));


        // fullscreen quad
        // -------------------------------------------------------------------
        console.log('creating fullscreen quad');
        const fquadMaterial = new Material(gl, this.fquadShader!);
        fquadMaterial.text.set(this.depthTexture);
        this.fullScreenQuad = new GameObject(new Mesh(quadGeometry, fquadMaterial));


        // frenet frames
        // -------------------------------------------------------------------
        console.log('creating frenet frames');
        const frenetMaterial = new Material(gl, this.frenetShader!);
        const frenetGeometry = new FrenetGeometry(gl);
        frenetGeometry.setPoints(tree);
        const frenetFrames = new GameObject(new Mesh(frenetGeometry, frenetMaterial, this.depthMaterial));


        // twigs
        // -------------------------------------------------------------------
        console.log('creating twigs');
        const twigMaterial = new Material(gl, this.twigShader!);
        twigMaterial.depthTexture.set(this.depthTexture);
        const twigs = new InstancedGeometry(gl, new TwigGeometry(gl), 3, false);
        twigs.setModelMatrices([new Mat4().scale(new Vec3(1, 0.07, 1))]);
        const twigsObject = new GameObject(new Mesh(twigs, twigMaterial, this.intancedDepthMaterial));


        // twig modelmatrices
        // -------------------------------------------------------------------
        console.log('calculating twig model matrices');
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


        // leaf modelmatrices
        // -------------------------------------------------------------------
        console.log('calculating leaf model matrices');
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

        this.treeObj = treeObject;

        // ground
        // -------------------------------------------------------------------
        const groundMaterial = new Material(gl, this.groundShader!);
        groundMaterial.depthTexture.set(this.depthTexture);
        const ground = new GameObject(new Mesh(quadGeometry, groundMaterial, this.depthMaterial));
        const ground_scale = 10000;
        ground.scale.set(ground_scale, ground_scale, ground_scale);
        ground.orientationVector.set(1, 0, 0);
        ground.orientation = rad(90);
        ground.position.set(0, 0, 0);

        // game objects
        // -------------------------------------------------------------------
        this.gameObjects = [];
        this.gameObjects.push(ground);
        this.gameObjects.push(treeObject);
        this.gameObjects.push(leavesObject);
        this.gameObjects.push(twigsObject);
        // this.gameObjects.push(frenetFrames);


        // light and camera
        // -------------------------------------------------------------------
        this.camera = new PerspectiveCamera();
        this.lightPos = new Vec3();
        this.lightLookat = new Vec3(0, 100, 0);
        Uniforms.shadow.strength.set(0.6);
    }

    update(gl: WebGL2RenderingContext, keysPressed: any): void {
        gl.clearDepth(1.0);
        // time
        // -------------------------------------------------------------------
        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;


        // update camera
        // -------------------------------------------------------------------
        this.camera.move(dt, keysPressed);
        Uniforms.camera.viewProj.set(this.camera.viewProjMatrix);
        Uniforms.camera.wEye.set(this.camera.position);


        // update light
        // -------------------------------------------------------------------
        this.lightPos.set(Math.cos(t/2)*100, 500, Math.sin(t/2)*100);
        Uniforms.camera.wLiPos.set(this.lightPos);

        const lightView = lookAt(this.lightPos, this.lightLookat, PerspectiveCamera.WORLD_UP);
        const lightProjection = ortho(-300, 300, -300, 300, 1, 1000);

        Uniforms.camera.lightSpaceMatrix
            .set(lightView)
            .mul(lightProjection);


        // rendering mode for tree
        // -------------------------------------------------------------------
        for (let mode of [0, 1, 2, 3, 4, 5]) {
            if (keysPressed[mode]) {
                this.treem.rendermode.set(mode);
            }
        }

        const render_tree_only = false;

        // render to framebuffer
        // -------------------------------------------------------------------
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (!render_tree_only) {
            for (const go of this.gameObjects) {
                go.draw(true);
            }
        } else {
            this.treeObj.draw(true);
        }


        // render to screen
        // -------------------------------------------------------------------
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (keysPressed.SPACE) {
            this.fullScreenQuad.draw();
        } else {
            if (!render_tree_only) {
                for (const go of this.gameObjects) {
                    go.draw();
                }
            } else {
                this.treeObj.draw();
            }

        }
    }

    onresize(width: number, height: number): void {
        console.log(`canvas resized to ${width} x ${height}`);
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



