
class TreeNode {
    public parent: TreeNode | null;
    public children: TreeNode[];
    public pos: Vec3;
    public tangent: Vec3;
    public normal: Vec3;
    public width: number;
    public branch_length: number;
    public depth: number;

    constructor(parent: TreeNode | null, pos: Vec3, tangent: Vec3, width: number, normal: Vec3, br = 0) {
        this.parent = parent;
        this.pos = pos;
        this.tangent = tangent.clone().normalize();
        this.width = width;
        this.children = [];
        this.normal = normal.clone().normalize();
        this.branch_length = br;
        this.depth = 0;
    }

    binormal(): Vec3 {
        return this.tangent.cross(this.normal).normalize();
    }

    getDominantChild(): TreeNode | null {
        let dominantChild = null;
        let smallestAngle = Number.MAX_SAFE_INTEGER;
        for (let child of this.children) {
            const angle = this.tangent.dot(child.tangent);
            if (angle < smallestAngle) {
                smallestAngle = angle;
                dominantChild = child;
            }
        }
        return dominantChild;
    }

    clone(): TreeNode {
        return new TreeNode(null, this.pos, this.tangent, this.width, this.normal, this.branch_length);
    }

    opposite(): TreeNode {
        return new TreeNode(null, this.pos, this.tangent.times(-1), this.width, this.normal.times(-1), this.branch_length);
    }

    getOrientationMatrix(): Mat4 {
        return createOrientationMatrix(this.tangent, this.normal, this.binormal());
    }
}