"use strict";

const ADD_MIDDLE_NODE = false;
const BEZIER_IZE = false;

class Scene {
    constructor(gl) {
        this.gl = gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.treeShader = Program.from(gl, 'tree.vert', 'tree.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'tangent' },
            { position: 4, name: 'bitangent' },
        ]);
        this.treeGeometry = new TreeGeometry(gl);
        const treeMaterial = new Material(gl, this.treeShader);
        this.treeTexture = new Texture2D(gl, `./pine.png`);
        this.treeTextureNorm = new Texture2D(gl, `./pine_normal.png`);
        treeMaterial.treeTexture.set(this.treeTexture);
        treeMaterial.treeTextureNorm.set(this.treeTextureNorm);

        const treeObject = new GameObject(new Mesh(this.treeGeometry, treeMaterial));

        this.gameObjects = [];
        this.gameObjects.push(treeObject);

        this.leavesShader = Program.from(gl, 'leaves.vert', 'leaves.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelM' },
        ]);

        this.frameShader = Program.from(gl, 'frenet.vert', 'frenet.frag', [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexColor' },
        ]);

        this.uniforms = {};
        UniformReflection.addProperties(gl, this.treeShader.glProgram, this.uniforms);

        this.uniforms_leaves = {};
        UniformReflection.addProperties(gl, this.leavesShader.glProgram, this.uniforms_leaves);

        this.uniforms_frenet = {};
        UniformReflection.addProperties(gl, this.frameShader.glProgram, this.uniforms_frenet);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        this.leaves = new QuadGeometry(gl);

        this.spheres = new SphereGeometry(gl);
{
        // function func(position, segments) {
        //     for (const seg of segments) {
        //         const d = distanceToLineSegment2(position, seg[0], seg[1]);
        //         if (d <= 10) {
        //             return 1;
        //         }
        //     }
        //     return 0;
        // }

        // function generateScalarFieldFromMetaballs(treeNodes, from, to, out_scalarField, res) {
        //     console.log('generating scalar filed');

        //     const segments = treeNodes.flatMap(node => {
        //         return node.children.map(child => {
        //             const dirToChild = child.pos.minus(node.pos);
        //             const dirToParent = node.pos.minus(child.pos);
        //             return [node.pos.plus(dirToChild.times(0.25)), child.pos.plus(dirToParent.times(0.25)), node.width];
        //         });
        //     });

        //     const start = new Date();

        //     for (let z = from.z; z < to.z; z+=res) {
        //         console.log(`z=${z}`);
        //         for (let y = from.y; y < to.y; y+=res) {
        //             for (let x = from.x; x < to.x; x+=res) {
        //                 const currentPos = new Vec3(x, y, z);

        //                 let val = 0;
        //                 for (const seg of segments) {
        //                     const dist = distanceToLineSegment2(currentPos, seg[0], seg[1])
        //                     if (dist <= res) {
        //                         val = 1;
        //                         break;
        //                     }
        //                     // val += 1 / dist;
        //                     // if (distanceToLineSegment2(currentPos, seg[0], seg[1]) <= res) {
        //                     //     val = 1;
        //                     //     break;
        //                     // }
        //                 }
        //                 out_scalarField.push(val);

        //             }
        //         }
        //     }

        //     const end = new Date();
        //     console.log(`genarting scalar field took ${end-start} ms`);
        // }


        // if (false) setTimeout(() => {
        //     const threshold = .1;

        //     const from = new Vec3(-600, 0, -600);
        //     const to = new Vec3(600, 600, 600);
        //     const res = 10;

        //     this.scalarField = [];

        //     generateScalarFieldFromMetaballs(this.tree.nodes, from, to, this.scalarField, res);

        //     this.mq = new MarchingCubesGeometry(gl, this.scalarField, from, to, threshold, res);
        // }, 3000);


        // this.spheres.setModelMatrices(m);
    }

        this.camera = new PerspectiveCamera();
        this.tree = new Tree();


        this.leavesTexture = new Texture2D(gl, `./leaves.png`);
        this.leavesTextureAlpha = new Texture2D(gl, `./leaves_alpha.png`);

        this.frenetGeometry = new FrenetGeometry(gl);

        this.last_tree_count = this.tree.nodes.length;

        this.BG_COLOR = new Vec3(1, 1, 1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.lastGrowth = this.timeAtFirstFrame;

        this.mode = 1;

        this.bs = new BezierSurfaceGeometry(gl);


        for (let i = 0; i < 100; i++) {
            this.tree.grow();
        }
        this.tree.spline(1);
        // this.tree.remove_intersecting_nodes(0.8);

        if (ADD_MIDDLE_NODE) {
            this.tree.add_middle_spline();
        }
    }

    update(gl, keysPressed) {

        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        if (timeAtThisFrame - this.lastGrowth > 33) {
            this.lastGrowth = timeAtThisFrame;


            if (this.tree.nodes.length !== this.last_tree_count) {
                this.treeGeometry.setPoints(this.tree);
                this.frenetGeometry.setPoints(this.tree.nodes);

                if (BEZIER_IZE) {
                    this.bs.setTree(this.tree);
                }

                const modelMatrices = [];
                for (const node of this.tree.nodes) {
                    if (node.children.length === 0 && this.tree.middleNodes.indexOf(node) === -1) {
                        modelMatrices.push(node.getTransformationMatrix().scale(BRANCH_LENGTH).translate(node.pos));
                        modelMatrices.push(node.getTransformationMatrix().scale(BRANCH_LENGTH).rotate(radians(90), node.dir).translate(node.pos));
                    }
                }
                this.leaves.setModelMatrices(modelMatrices);
            }
            this.last_tree_count = this.tree.nodes.length;
        }

        // clear the screen
        gl.clearColor(this.BG_COLOR.x, this.BG_COLOR.y, this.BG_COLOR.z, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // update camera
        this.camera.move(dt, keysPressed);

        // draw objects
        for (const obj of this.gameObjects) {
            obj.draw(this.camera);
        }

        // render tree
        // this.uniforms.treeTexture.set(this.treeTexture);
        // this.uniforms.treeTextureNorm.set(this.treeTextureNorm);

        // if (keysPressed['1']) {
        //     this.mode = 1;
        // }
        // if (keysPressed['2']) {
        //     this.mode = 2;
        // }

        // this.treeShader.commit();
        // UniformReflection.commitProperties(gl, this.treeShader.glProgram, this.uniforms);

        if (this.mq) this.mq.draw();
        if (BEZIER_IZE) this.bs.draw(this.mode === 2);

        // this.treeGeometry.draw(this.mode === 2);

        this.frameShader.commit();
        UniformReflection.commitProperties(gl, this.frameShader.glProgram, this.uniforms_frenet);
        this.frenetGeometry.draw();

        // render leaves
        this.uniforms_leaves.leaves.set(this.leavesTexture);
        this.uniforms_leaves.leaves_alpha.set(this.leavesTextureAlpha);

        this.leavesShader.commit();
        UniformReflection.commitProperties(gl, this.leavesShader.glProgram, this.uniforms_leaves);
        this.leaves.draw();

        // this.spheres.draw();


        // this.camera.move(dt, keysPressed);
        // Uniforms.trafo.rayDirMatrix.set(this.camera.rayDirMatrix);

        // for(let i=0; i<this.gameObjects.length; i++) {
        //     this.gameObjects[i].draw(this.camera);
        // }
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



