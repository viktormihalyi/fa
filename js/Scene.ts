// const BG_COLOR = new Vec3(197,231,252).over(255);
const BG_COLOR = new Vec3(1, 1, 1);

class Scene {
    public gl: WebGL2RenderingContext;

    // time
    private timeAtFirstFrame: number;
    private timeAtLastFrame: number;

    private camera: PerspectiveCamera;
    private gameObjects: GameObject[];

    private depthTexture: WebGLTexture;
    private depthFrameBuffer: WebGLFramebuffer;

    private lightPos: Vec3;
    private lightLookat: Vec3;
    private fullScreenQuad: GameObject;

    // tree
    private trees: TreeObject[];

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
    private leavesDepthMaterial: Material;
    private twigMaterial: Material;
    private leafMaterial: Material;
    private treeMaterial: Material;

    // etc
    private targetTextureWidth: number;
    private targetTextureHeight: number;
    private canvasWidth: number;
    private canvasHeight: number;

    initShaders() {
        console.log('compiling and linking shaders');
        const gl = this.gl;

        // depth shaders
        // -------------------------------------------------------------------
        this.depthShader = Program.from(gl, 'depth.vert', 'depth.frag', [
            { position: 0, name: 'vertexPosition' },
        ]);

        this.instancedDepthShader = Program.from(gl, 'depth_instanced.vert', 'depth.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 3, name: 'instanceModelMatrix' },
        ]);

        this.leavesDepthShader = Program.from(gl, 'depth_instanced.vert', 'depth_leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'instanceModelMatrix' },
        ]);

        // normal shaders
        // -------------------------------------------------------------------
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
            { position: 3, name: 'instanceModelMatrix' },
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
            { position: 3, name: 'instanceModelMatrix' },
        ]);

        this.groundShader = Program.from(gl, 'ground.vert', 'ground.frag', [
            { position: 0, name: 'vertexPosition' }
        ]);
    }

    constructor(gl: WebGL2RenderingContext, app: App) {
        this.gl = gl;
        this.initShaders();

        this.canvasWidth = 0;
        this.canvasHeight = 0;

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
        this.targetTextureWidth = 2048;
        this.targetTextureHeight = 2048;
        this.depthTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.targetTextureWidth, this.targetTextureHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        // create depth buffer
        // -------------------------------------------------------------------
        console.log('creating depth framebuffer');
        this.depthFrameBuffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        this.depthMaterial = new Material(gl, this.depthShader!);
        this.intancedDepthMaterial = new Material(gl, this.instancedDepthShader!);
        this.leavesDepthMaterial = new Material(gl, this.leavesDepthShader!);


        // tree
        // -------------------------------------------------------------------
        this.treeMaterial = new Material(gl, this.treeShader!);
        this.treeMaterial.treeTexture.set(new Texture2D(gl, 'media/bark.jpg'));
        this.treeMaterial.treeTextureNorm.set(new Texture2D(gl, 'media/bark_normal.jpg'));
        this.treeMaterial.treeTextureHeight.set(new Texture2D(gl, 'media/bark_height.jpg'));
        this.treeMaterial.mossTexture.set(new Texture2D(gl, 'media/mossy_rock.jpg'));
        this.treeMaterial.mossTextureNorm.set(new Texture2D(gl, 'media/mossy_rock_normal.jpg'));
        this.treeMaterial.mossTextureHeight.set(new Texture2D(gl, 'media/mossy_rock_height.jpg'));
        this.treeMaterial.mossyness.set(1.75);
        this.treeMaterial.depthTexture.set(this.depthTexture);

        this.treeMaterial.rendermode.set(0);
        console.log(this.treeMaterial);

        // leaves
        // -------------------------------------------------------------------
        this.leafMaterial = new Material(gl, this.leavesShader!);
        this.leafMaterial.leaves.set(new Texture2D(gl, `media/leaf01.jpg`));
        const leaves_alpha_texture = new Texture2D(gl, `media/leaf01_alpha.jpg`);
        this.leavesDepthMaterial.leaves_alpha.set(leaves_alpha_texture);
        this.leafMaterial.leaves_alpha.set(leaves_alpha_texture);
        this.leafMaterial.leaves_translucency.set(new Texture2D(gl, `media/leaf01_translucency.jpg`));
        this.leafMaterial.depthTexture.set(this.depthTexture);



        // fullscreen quad
        // -------------------------------------------------------------------
        console.log('creating fullscreen quad');
        const fquadMaterial = new Material(gl, this.fquadShader!);
        fquadMaterial.text.set(this.depthTexture);
        this.fullScreenQuad = new GameObject(new Mesh(new QuadGeometry(gl), fquadMaterial));


        // frenet frames
        // -------------------------------------------------------------------
        console.log('creating frenet frames');
        const frenetMaterial = new Material(gl, this.frenetShader!);


        // twigs
        // -------------------------------------------------------------------
        console.log('creating twigs');
        this.twigMaterial = new Material(gl, this.twigShader!);
        this.twigMaterial.depthTexture.set(this.depthTexture);


        // ground
        // -------------------------------------------------------------------
        const groundMaterial = new Material(gl, this.groundShader!);
        groundMaterial.depthTexture.set(this.depthTexture);
        const ground = new GameObject(new Mesh(new QuadGeometry(gl), groundMaterial, this.depthMaterial));
        ground.position.set(0, -1, 0);
        ground.scale = 100000;
        ground.orientationVector.set(1, 0, 0);
        ground.orientation = rad(90);


        // game objects
        // -------------------------------------------------------------------
        this.gameObjects = [];
        this.gameObjects.push(ground);


        // tree
        // -------------------------------------------------------------------

        const t0 = new TreeObject(gl,
            this.treeMaterial, this.leafMaterial, this.twigMaterial,
            frenetMaterial,
            this.depthMaterial, this.leavesDepthMaterial, this.intancedDepthMaterial);
        const t1 = new TreeObject(gl,
            this.treeMaterial, this.leafMaterial, this.twigMaterial,
            frenetMaterial,
            this.depthMaterial, this.leavesDepthMaterial, this.intancedDepthMaterial);
        t1.position.set(0, 0, 500);

        const t2 = new TreeObject(gl,
            this.treeMaterial, this.leafMaterial, this.twigMaterial,
            frenetMaterial,
            this.depthMaterial, this.leavesDepthMaterial, this.intancedDepthMaterial);
        t2.position.set(0, 0, -500);

        this.trees = [];
        this.trees.push(t0);
        this.trees.push(t1);
        this.trees.push(t2);

        // light and camera
        // -------------------------------------------------------------------
        this.camera = new PerspectiveCamera();
        this.lightPos = new Vec3();
        this.lightLookat = new Vec3(0, 100, 0);
        Uniforms.shadow.strength.set(0.6);
    }

    update(gl: WebGL2RenderingContext, keysPressed: any): void {
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
        const def_offset = radians(145);
        this.lightPos.set(Math.cos(t/66+def_offset)*600, 500, Math.sin(t/66+def_offset)*600);
        Uniforms.camera.wLiPos.set(this.lightPos);

        const lightView = lookAt(this.lightPos, this.lightLookat, PerspectiveCamera.WORLD_UP);
        const lightProjection = ortho(-1000, 1000, -1000, 1000, 10, 3000);

        Uniforms.camera.lightSpaceMatrix
            .set(lightView)
            .mul(lightProjection);


        // rendering mode for tree
        // -------------------------------------------------------------------
        for (let mode of [0, 1, 2, 3, 4, 5]) {
            if (keysPressed[mode]) {
                this.treeMaterial.rendermode.set(mode);
            }
        }

        const time_before_render = Date.now();

        // render to framebuffer
        // -------------------------------------------------------------------
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
        gl.viewport(0, 0, this.targetTextureWidth, this.targetTextureHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (const t of this.trees) {
            t.draw(true);
        }
        for (const go of this.gameObjects) {
            go.draw(true);
        }

        if (keysPressed.H) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        // render to screen
        // -------------------------------------------------------------------
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (keysPressed.SPACE) {
            this.fullScreenQuad.draw();
        } else {
            for (const t of this.trees) {
                t.draw();
            }
            for (const go of this.gameObjects) {
                go.draw();
            }
        }

        const time_after_render = Date.now();
        const render_time_ms = Math.max(time_after_render - time_before_render, 1);
        // console.log(`${1000/render_time_ms} fps`);
    }

    onresize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
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

    ontouch(event: TouchEvent): void {
        this.camera.touchMove(event);
    }
}
