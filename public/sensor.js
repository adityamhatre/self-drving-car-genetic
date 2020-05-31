class Sensor {
    canSeeDistance = SENSOR_DISTANCE
    pos = createVector()
    sensed = false
    danger = false
    rightPath = false

    constructor(pos, heading) {
        this.pos = pos
        this.heading = heading
    }

    sense() {
        let closestWallDistance = Infinity
        let sensedAt = false
        this.danger = false
        this.rightPath = false
        for (let wall of walls) {
            let x1 = wall.a.x
            let y1 = wall.a.y

            let x2 = wall.b.x
            let y2 = wall.b.y

            let x3 = this.pos.x
            let y3 = this.pos.y

            let x4 = x3 + this.canSeeDistance * cos((this.heading))
            let y4 = y3 + this.canSeeDistance * sin((this.heading))


            let intersects = this.intersectionPt(x1, x2, x3, x4, y1, y2, y3, y4)

            if (intersects) {
                let intersectDistance = this.dist(x3, y3, intersects[0], intersects[1])
                if (intersectDistance < closestWallDistance) {
                    sensedAt = intersectDistance
                    this.danger = true
                    closestWallDistance = intersectDistance
                }
            }
        }

        if (!this.danger) {
            for (let wall of greenWalls) {
                let x1 = wall.a.x
                let y1 = wall.a.y

                let x2 = wall.b.x
                let y2 = wall.b.y

                let x3 = this.pos.x
                let y3 = this.pos.y

                let x4 = x3 + this.canSeeDistance * cos((this.heading))
                let y4 = y3 + this.canSeeDistance * sin((this.heading))


                let intersects = this.intersectionPt(x1, x2, x3, x4, y1, y2, y3, y4)

                if (intersects) {
                    this.rightPath = true
                    let intersectDistance = this.dist(x3, y3, intersects[0], intersects[1])
                    if (intersectDistance < closestWallDistance) {
                        sensedAt = intersectDistance
                        closestWallDistance = intersectDistance
                    }
                }
            }
            
        }
        return sensedAt
    }

    dist(x1, y1, x2, y2) {
        return sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2))
    }

    intersectionPt(x1, x2, x3, x4, y1, y2, y3, y4) {

        var uA, uB;
        var den, numA, numB;
        var intx, inty;

        den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        numA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
        numB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

        //Coincident? - If true, displays intersection in center of line segment
        if (abs(numA) == 0 && abs(numB) == 0 && abs(den) == 0) {
            intx = (x1 + x2) / 2;
            inty = (y1 + y2) / 2;
            return [intx, inty];
        }

        //Parallel? - No intersection
        if (abs(den) == 0) {
            intx = 0;
            inty = 0;
            return (false);
        }

        //Intersection?
        uA = numA / den;
        uB = numB / den;

        //If both lie w/in the range of 0 to 1 then the intersection point is within both line segments.
        if (uA < 0 || uA > 1 || uB < 0 || uB > 1) {
            intx = 0;
            inty = 0;
            return (false);
        }
        intx = x1 + uA * (x2 - x1);
        inty = y1 + uA * (y2 - y1);
        return [intx, inty];
    }

    draw() {

        push()
        strokeWeight(1)
        translate(this.pos.x, this.pos.y)
        if (this.sensed) {
            ellipse(
                this.sensed * cos((this.heading)),
                this.sensed * sin((this.heading)), 8)
            stroke(this.danger ? "red" : "green")
            line(0, 0,
                this.sensed * cos((this.heading)),
                this.sensed * sin((this.heading)))
        } else {
            stroke("white")
            line(0, 0,
                this.canSeeDistance * cos((this.heading)),
                this.canSeeDistance * sin((this.heading)))
        }
        pop()
    }


}