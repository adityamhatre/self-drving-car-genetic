class Boundary {
    constructor(x1, y1, x2, y2) {
        this.a = createVector(x1, y1)
        this.b = createVector(x2, y2)
    }

    draw() {
        stroke(255)
        strokeWeight(3)
        line(this.a.x, this.a.y, this.b.x, this.b.y)
    }
}

class CheckPoint {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    draw() {
        stroke(255)
        strokeWeight(4)
        point(this.x, this.y)
    }
}

class StartCheckPoint {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    draw() {
        stroke(0)
        fill("cyan")
        ellipse(this.x, this.y, 20)
    }
}

class EndCheckPoint {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    draw() {
        stroke(0)
        fill("green")
        ellipse(this.x, this.y, 20)
    }
}

class GreenWall {
    constructor(x1, y1, x2, y2) {
        this.a = createVector(x1, y1)
        this.b = createVector(x2, y2)

    }

    draw() {
        stroke("green")
        line(this.a.x, this.a.y, this.b.x, this.b.y)

    }
}