"use strict";

const BG_COLOR = new Vec3(240,248,255).over(255);

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
        tree.add_ends();

        for (const node of tree.nodes) {
            for (const nodeb of tree.nodes) {
                if (node !== nodeb) {
                    const dist = node.pos.minus(nodeb.pos).length();
                    if (dist < 0.1) {
                        console.log('bajvan', dist);
                    }
                }
            }
        }
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
        this.treeMaterial = new Material(gl, treeShader);
        this.treeMaterial.treeTexture.set(new Texture2D(gl, `./pine.png`));
        this.treeMaterial.treeTextureNorm.set(new Texture2D(gl, `./pine_normal.png`));
        const treeObject = new GameObject(new Mesh(treeGeometry, this.treeMaterial));


        const leavesShader = Program.from(gl, 'leaves.vert', 'leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelM' },
        ]);

        const leafMaterial = new Material(gl, leavesShader);
        leafMaterial.leaves.set(new Texture2D(gl, `./leaf01_color.png`));
        leafMaterial.leaves_alpha.set(new Texture2D(gl, `./leaf01_alpha.png`));
        leafMaterial.leaves_translucency.set(new Texture2D(gl, `./leaf01_translucency.png`));

        const quadGeometry = new QuadGeometry(gl);
        const leavesGeometry = new InstancedGeometry(gl, quadGeometry, 3, true);
        leavesGeometry.setModelMatrices(
            tree.nodes
                .filter(node => node.children.length === 0)
                .map(node => node.parent)
                // .filter(node => node.width < 4)
                // .flatMap(node => Math.random() < 0.2 ? [node] : [])
                .flatMap(node => [
                    node.getOrientationMatrix().scale(BRANCH_LENGTH/4.0).rotate(rad(90), node.normal).rotate(rad(45), Vec3.random().normalize()).translate(lerpVec3(node.pos, node.parent.pos, Math.random())),
                    // node.getOrientationMatrix().scale(BRANCH_LENGTH/2.0).rotate(radians(0), node.dir).translate(node.pos),
                    // node.getOrientationMatrix().scale(BRANCH_LENGTH).rotate(radians(120), node.dir).translate(node.pos),
                    // node.getOrientationMatrix().scale(BRANCH_LENGTH).rotate(radians(240), node.dir).translate(node.pos),
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

        const twigShader = new Material(gl, Program.from(gl, 'twig.vert', 'twig.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'modelMatrix' },
        ]));
        const twigs = new InstancedGeometry(gl, new LeafGeometry(gl), 2, false);
        twigs.setModelMatrices([new Mat4().scale(new Vec3(1, 0.07, 1))]);


        class Twig {
            constructor(position, tangent, normal, asd) {
                this.position = position;
                this.tangent = tangent.times(2).plus(normal).normalize();
                this.normal = normal;
                this.binormal = this.tangent.cross(normal).normalize();
                this.orientationMatrix = createOrientationMatrix(this.tangent, this.normal, this.binormal);
                this.modelMatrix = new Mat4()
                    .scale(0.1)
                    .mul(this.orientationMatrix)
                    .rotate(rad(randomBetween(0, 360)), tangent)
                    .translate(this.position);
            }
        }

        const twigs_model = [];

        for (const node of tree.nodes.filter(node => node.width < 4 && node.children.length > 0)) {
            for (let i = 0; i < 3; i++) {
                const p = lerpVec3(node.parent.pos, node.parent.pos, Math.random());
                twigs_model.push(new Twig(p, node.dir, node.normal, i*120));
            }
        }

        twigs.setModelMatrices(twigs_model.map(t => t.modelMatrix));

        // const twigs_model_matrices = tree.nodes
        //     .filter(node => node.width < 4 && node.children.length > 0)
        //     // .filter(node => node.children.length === 0).map(node => node.parent)
        //     .flatMap(node => [
        //         new Mat4()
        //             .scale(0.1)
        //             .mul(node.getOrientationMatrix())
        //             // .rotate(rad(randomBetween(0, 360)), node.normal)
        //             .translate(node.pos)
        //     ]);

        const LEAF_SCALE = 10.0;
        leavesGeometry.setModelMatrices(
            twigs_model
                .map(m => m.modelMatrix)
                .map(m => new Mat4()
                    .scale(LEAF_SCALE*10)
                    .rotate(rad(-15))
                    .translate(new Vec3(0, 175, 0))
                    .translate(new Vec3(0, 10, 0))
                    .mul(m)
                )
        );

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
        testQ.scale = 50;

        // this.gameObjects.push(testQ);

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

        this.treeMaterial.wLiPos.set(new Vec3(Math.cos(t/5)*300, 200, Math.sin(t/5)*300));

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



