class TreeConfig {
    [x: string]: any;

    public generate() {
        this.GROW_ITERATIONS = 200;
        // number of attraction points to generate
        this.ATTRACTION_POINT_COUNT = randomBetween(300, 500);

        this.FLATNESS = randomBetweenFloat(0.8, 1.5);

        // attraction points generation around a circle
        this.CIRCLE_CENTER = new Vec3(randomBetween(-33, 33), 400+randomBetween(-50, 50), randomBetween(-33, 33));
        this.CIRCLE_RADIUS = randomBetween(200, 300);

        // space colonization algorithm constnts
        this.INFL_MIN_DIST = 40;
        this.INFL_MAX_DIST = 150;
        this.BRANCH_LENGTH = randomBetween(25, 35);
        this.BRANCH_LENGTH_SCALE = 0.99;

        // starting tree node values
        this.TREE_INITIAL_POS = new Vec3(0, 0, 0);
        this.TREE_INITIAL_DIRECTION = new Vec3(0, 1, 0);
        this.TREE_INITIAL_NORMAL = new Vec3(0, 0, 1);
        this.TREE_STARTING_WIDTH = randomBetween(10, 15);

        // stop grwoing after reaching this many tree nodes
        this.MAX_TREE_SIZE = 1500000;

        // how much the previous growing direction should affect the next node
        // 0 - not taken into consideration
        this.PREVIOUS_DIR_POWER = 0.9;

        // width scales with each node
        this.BRANCH_WIDTH_SCALE = randomBetweenFloat(0.9, 0.95);

        console.log(this);
    }
}
