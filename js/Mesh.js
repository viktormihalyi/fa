"use strict";
class Mesh {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
    }

    draw() {
        this.material.commit();
        this.geometry.draw();
    }
}