"use strict";

const BG_COLOR = new Vec3(0.9, 0.9, 0.9);

class Scene {
    constructor(gl) {
        this.gl = gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        const tree = new Tree();
        for (let i = 0; i < 100; i++) {
            tree.grow();
        }
        tree.spline(1);
        // tree.remove_intersecting_nodes(0.8);

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
        treeMaterial.treeTexture.set(new Texture2D(gl, `./pine.png`));
        treeMaterial.treeTextureNorm.set(new Texture2D(gl, `./pine_normal.png`));
        const treeObject = new GameObject(new Mesh(treeGeometry, treeMaterial));


        const leavesShader = Program.from(gl, 'leaves.vert', 'leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelM' },
        ]);

        const leafMaterial = new Material(gl, leavesShader);
        leafMaterial.leaves.set(new Texture2D(gl, `./leaves.png`));
        leafMaterial.leaves_alpha.set(new Texture2D(gl, `./leaves_alpha.png`));

        const quadGeometry = new QuadGeometry(gl);
        const leavesGeometry = new InstancedGeometry(gl, quadGeometry, 3, true);
        leavesGeometry.setModelMatrices(
            tree.nodes
                .filter(node => node.children.length === 0)
                .flatMap(node => [
                    node.getTransformationMatrix().scale(BRANCH_LENGTH).translate(node.pos),
                    node.getTransformationMatrix().scale(BRANCH_LENGTH).rotate(radians(90), node.dir).translate(node.pos)
                ])
        );
        const leavesObject = new GameObject(new Mesh(leavesGeometry, leafMaterial));


        const frenetShader = Program.from(gl, 'frenet.vert', 'frenet.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexColor' },
        ]);
        const frenetMaterial = new Material(gl, frenetShader);
        const frenetGeometry = new FrenetGeometry(gl);
        frenetGeometry.setPoints(tree);
        const frenetFrames = new GameObject(new Mesh(frenetGeometry, frenetMaterial));


        this.gameObjects = [];
        this.gameObjects.push(treeObject);
        this.gameObjects.push(leavesObject);
        this.gameObjects.push(frenetFrames);

        this.camera = new PerspectiveCamera();
    }

    update(gl, keysPressed) {

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

        // draw objects
        for (const obj of this.gameObjects) {
            obj.draw(this.camera);
        }
    }

    onresize(width, height) {
        this.camera.setAspectRatio(width / height);
    }

    onmousedown(event) {
        this.camera.mouseDown(event);
    }
    onmousemove(event) {
        this.camera.mouseMove(event);
    }
    onmouseup(event) {
        this.camera.mouseUp(event);
    };
}



