
declare class Vec2 {
    x: number;
    y: number;

    constructor();
    constructor(x: number, y: number);

    set(): this;

    minus(v: Vec2): Vec2;
}
