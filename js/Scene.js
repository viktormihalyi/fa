"use strict";

// https://en.wikipedia.org/wiki/File:Catmull-Rom_Parameterized_Time.png
// centripetal: alpha = 0.5
// uniform:     alpha = 0
// chordal:     alpha = 1
const ALPHA = 1;
const EPSILON = 1e-2;

// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
// centripetal catmull rom spline
function catmull_rom_spline(p0, p1, p2, p3, t) {
    const t0 = 0;
    const t1 = tj(t0, p0, p1);
    const t2 = tj(t1, p1, p2);
    const t3 = tj(t2, p2, p3);

    t = lerp(t1, t2, t);

    const a1 = p0.times((t1-t) / (t1-t0)).plus(p1.times((t-t0) / (t1-t0)));
    const a2 = p1.times((t2-t) / (t2-t1)).plus(p2.times((t-t1) / (t2-t1)));
    const a3 = p2.times((t3-t) / (t3-t2)).plus(p3.times((t-t2) / (t3-t2)));

    const b1 = a1.times((t2-t) / (t2-t0)).plus(a2.times((t-t0) / (t2-t0)));
    const b2 = a2.times((t3-t) / (t3-t1)).plus(a3.times((t-t1) / (t3-t1)));

    const c  = b1.times((t2-t) / (t2-t1)).plus(b2.times((t-t1) / (t2-t1)));
    return c;
}

function tj(ti, pi, pj) {
    let len = Math.max(EPSILON, pj.minus(pi).length());
    return Math.pow(len, ALPHA) + ti;
}


class Scene {
    constructor(gl) {
        this.gl = gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const vsIdle = new Shader(gl, gl.VERTEX_SHADER, 'tree.vert');
        const fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, 'tree.frag');
        this.solidProgram = new Program(gl, vsIdle, fsSolid, [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
        ]);

        const vs = new Shader(gl, gl.VERTEX_SHADER, 'leaves.vert');
        const fs = new Shader(gl, gl.FRAGMENT_SHADER, 'leaves.frag');
        this.leavesShader = new Program(gl, vs, fs, [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexNormal' },
            { position: 2, name: 'vertexTexCoord' },
            { position: 3, name: 'modelM' },
        ]);

        const fvs = new Shader(gl, gl.VERTEX_SHADER, 'frenet.vert');
        const ffs = new Shader(gl, gl.FRAGMENT_SHADER, 'frenet.frag');
        this.frenetShader = new Program(gl, fvs, ffs, [
            { position: 0, name: 'vertexPosition' },
            { position: 1, name: 'vertexColor' },
        ]);

        this.uniforms = {};
        UniformReflection.addProperties(gl, this.solidProgram.glProgram, this.uniforms);

        this.uniforms_leaves = {};
        UniformReflection.addProperties(gl, this.leavesShader.glProgram, this.uniforms_leaves);

        this.uniforms_frenet = {};
        UniformReflection.addProperties(gl, this.frenetShader.glProgram, this.uniforms_frenet);

        this.timeAtFirstFrame = new Date().getTime();
        this.timeAtLastFrame = this.timeAtFirstFrame;

        this.leaves = new QuadGeometry(gl);

        this.spheres = new SphereGeometry(gl);

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


        this.camera = new PerspectiveCamera();
        this.tree = new Tree();

        this.treeTexture = new Texture2D(gl, `./pine.png`);

        this.leavesTexture = new Texture2D(gl, `./leaves.png`);
        this.leavesTextureAlpha = new Texture2D(gl, `./leaves_alpha.png`);

        this.treeGeometry = new TreeGeometry(gl);
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
        this.tree.spline(2);
        this.tree.remove_intersecting_nodes(1.1);
    }

    update(gl, keysPressed) {

        const timeAtThisFrame = new Date().getTime();
        const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
        const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
        this.timeAtLastFrame = timeAtThisFrame;

        if (timeAtThisFrame - this.lastGrowth > 33) {
            this.lastGrowth = timeAtThisFrame;


            if (this.tree.nodes.length !== this.last_tree_count) {
                this.treeGeometry.setPoints(this.tree.nodes);
                this.frenetGeometry.setPoints(this.tree.nodes);
                this.bs.setTree(this.tree);

                const modelMatrices = [];
                for (const node of this.tree.nodes) {
                    if (node.children.length === 0) {
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
        Uniforms.camera.viewProj.set(this.camera.viewProjMatrix);


        // render tree
        this.uniforms.tree.set(this.treeTexture, 0);

        if (keysPressed['1']) {
            this.mode = 1;
        }
        if (keysPressed['2']) {
            this.mode = 2;
        }

        this.solidProgram.commit();
        UniformReflection.commitProperties(gl, this.solidProgram.glProgram, this.uniforms);

        if (this.mq) this.mq.draw();
        if (this.bs) this.bs.draw(this.mode === 2);

        this.treeGeometry.draw(this.mode === 2);

        this.frenetShader.commit();
        UniformReflection.commitProperties(gl, this.frenetShader.glProgram, this.uniforms_frenet);
        this.frenetGeometry.draw();

        // render leaves

        this.uniforms_leaves.leaves.set(this.leavesTexture);
        this.uniforms_leaves.leaves_alpha.set(this.leavesTextureAlpha);

        this.leavesShader.commit();
        UniformReflection.commitProperties(gl, this.leavesShader.glProgram, this.uniforms_leaves);
        // this.leaves.draw();

        // this.spheres.draw();
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



