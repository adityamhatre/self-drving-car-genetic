class Car {
    width = 50
    height = 20
    heading = [0]
    speed = 2
    pos = createVector()
    prev_pos = null
    crashed = false

    sensors = []
    score = 0
    timeAlive = 0
    reached = false

    done = false

    fuel = MAX_FUEL

    constructor(x, y) {

        this.pos.x = x
        this.pos.y = y
        this.heading = [90]

        let offset = 45
        for (var i = 0 + offset; i <= 90 + offset; i += 20) {
            this.sensors.push(new Sensor(this.pos, radians(i)))
        }

        const fuelDecreaser = setInterval(_ => {
            if (this.done) {
                clearInterval(fuelDecreaser)
                return
            }
            this.fuel -= 1
            if (this.fuel < 0 || this.crashed) {
                this.crashed = true
                this.done = true
                clearInterval(fuelDecreaser)
            }
        }, 1000)
    }

    getReadingsForNN() {
        let readings = []
        for (var i = 0; i < this.sensors.length; i++) {
            if (this.sensors[i].sensed) {
                readings.push(map(this.sensors[i].sensed, 0, SENSOR_DISTANCE, 0, 1))
                if (this.sensors[i].danger) {
                    readings[i] *= -1
                }
                if (this.sensors[i].rightPath) {
                    readings[i] = SENSOR_DISTANCE
                }
            } else {
                //give more preference if on right path
                readings.push(SENSOR_DISTANCE / 2)
            }
        }
        return readings
    }
    getSensorReadings() {
        this.score = this.fuel * (180 + degrees(atan2(height / 2 - this.pos.y, width / 2 - this.pos.x)))

        if (this.angularDistance(endCheckPoint.x, endCheckPoint.y, this.pos.x, this.pos.y) < radians(2)) {
            this.reached = true
            this.done = true
            this.score *= 2
        }

        for (var i = 0; i < this.sensors.length; i++) {
            if (this.sensors[i].sensed) {
                if (this.sensors[i].danger) {
                    if (this.sensors[i].sensed < 20) {
                        this.crashed = true
                        this.done = true
                        break;
                    }
                }
                if (this.sensors[i].rightPath) {
                    if (this.sensors[i].sensed < 2) {
                        this.score += 10
                        // break;
                    }
                }
            }
        }
    }

    angularDistance(x1, y1, x2, y2) {
        const x0 = width / 2
        const y0 = height / 2

        const nume = (x2 - x0) * (x1 - x0) + (y2 - y0) * (y1 - y0)
        const den = sqrt((pow(x2 - x0, 2) + pow(y2 - y0, 2)) * (pow(x1 - x0, 2) + pow(y1 - y0, 2)))

        return (acos(nume / den))
    }
    askSensorToSense() {
        for (var i = 0; i < this.sensors.length; i++) {
            this.sensors[i].sensed = this.sensors[i].sense()
        }

    }

    rotateLeft() {
        if (this.done) return
        this.heading[0] -= 1
        for (var i = 0; i < this.sensors.length; i++) {
            this.sensors[i].heading -= radians(1)
        }

        this.askSensorToSense()
        this.getSensorReadings()
    }

    rotateRight() {
        if (this.done) return
        this.heading[0] += 1
        for (var i = 0; i < this.sensors.length; i++) {
            this.sensors[i].heading += radians(1)
        }

        this.askSensorToSense()
        this.getSensorReadings()
    }

    forward(speed = 2) {
        if (this.done) return

        this.pos.x += speed * cos(radians(this.heading[0]))
        this.pos.y += speed * sin(radians(this.heading[0]))

        this.askSensorToSense()
        this.getSensorReadings()
    }

    reverse() {
        if (this.done) return
        this.pos.x -= this.speed * cos(radians(this.heading[0]))
        this.pos.y -= this.speed * sin(radians(this.heading[0]))

        this.askSensorToSense()
        this.getSensorReadings()
    }

    draw(iMaxCar = false) {
        if (this.pos.x > width || this.pos.y > height) {
            this.crashed = true
        }
        if (this.crashed) return
        stroke(255)
        strokeWeight(iMaxCar ? 4 : 1)

        const x = this.pos.x
        const y = this.pos.y
        push()
        translate(x, y)
        rotate(radians(this.heading[0]))

        push()
        rotate(radians(90))

        push()
        rotate(radians(270))
        if (iMaxCar) {
            scale(map(this.fuel, 0, MAX_FUEL, 0, 1.5))
        } else {
            scale(map(this.fuel, 0, MAX_FUEL, 0, 1))
        }
        image(car_img, -this.width / 2, -this.height / 2, this.width, this.height)
        pop()
        let carColor = color("green")
        carColor.setAlpha(map(this.fuel, 0, MAX_FUEL, 0, 255))
        fill(carColor)
        // rect(-this.height / 2, -this.width / 2, this.height, this.width)
        pop()


        pop()

        if (iMaxCar) {
            this.sensors.forEach(_ => _.draw())
        }
        if (DRAW_RAYS)
            this.sensors.forEach(_ => _.draw())

    }
}