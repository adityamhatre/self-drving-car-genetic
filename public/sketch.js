function preload() {
    car_img = loadImage('assets/car.png');
    car_img.resize(0, 1)
}
function setup() {

    createCanvas(Bounds.MAX_X, Bounds.MAX_Y)
    frameRate(FRAME_RATE)
    walls = []
    greenWalls = []
    startCheckPoint = new StartCheckPoint(0, 0)
    endCheckPoint = new EndCheckPoint(0, 0)
    checkPoints = []
    cars = []
    worldResetCounter = 0
    currentTry = 1

    startTimeForCurrentGen = Date.now()

    showCheckPointsBtn = createButton(`Toggle checkpoints`)
    showCheckPointsBtn.position(200, 930)
    showCheckPointsBtn.mousePressed(() => {
        DRAW_GREEN_WALLS = !DRAW_GREEN_WALLS;
    })

    if (!useSaved) {
        trainedModelButton = createButton("Load trained model on new track")
        trainedModelButton.position(200, 900)
        trainedModelButton.mousePressed(() => { localStorage.setItem('navigated', true);; window.location.href = "manual.html" })
    }
    setupWorld()
    setupNN()

    maxScore = -Infinity
    maxCar = 0
    if (useSaved) {
        neat.import(savedModel)
    }

    SIMULATION_SPEED = { value: () => 1 }//createSlider(1, MAX_SIMULATION_SPEED, 1)

    waitForLoop = false
    setInterval(() => {
        if (!waitForLoop) {
            waitForLoop = true
            for (let i = 0; i < SIMULATION_SPEED.value(); i++) {
                genetic()
            }
            waitForLoop = false
        }

    }, 10)
}


function draw() {
    background(0)
    controls()
    drawWorld()
}

function genetic() {
    startTimeForCurrentGen += 1
    for (var i = 0; i < cars.length; i++) {
        car = cars[i]
        neat.setInputs(car.getReadingsForNN(), i)
    }
    neat.feedForward()
    for (var i = 0; i < cars.length; i++) {
        car = cars[i]

        decisions = neat.creatures[i].getOutputLayerValues()
        if (decisions[0] > 0.5) {
            car.rotateLeft()
        }
        else if (decisions[1] > 0.5) {
            car.rotateRight()
        }

        car.forward(map(decisions[2], 0, 1, 0, MAX_SPEED))

    }

    if (!useSaved) {
        allCrashed = cars.every(car => car.crashed)
        if (allCrashed) {
            endTimeForCurrentGen = Date.now()
            if (endTimeForCurrentGen - startTimeForCurrentGen < 200) {
                setupWorld()
                return
            }
        }


        goToNextGeneration = cars.every(car => car.done)
        if (goToNextGeneration) {
            startTimeForCurrentGen = Date.now()
            for (var i = 0; i < POP_SIZE; ++i) {
                const car = cars[i]
                const score = car.score
                neat.setFitness(score, i)
            }

            if (atleast(MINIMUM_PERCENT)) {
                setupWorld()
            } else {
                currentTry += 1
                if (currentTry > MAX_TRIES_FOR_LEVEL) {
                    setupWorld()
                }
                neat.doGen()
            }

            for (var i = 0; i < POP_SIZE; ++i) {
                cars[i] = new Car(startCheckPoint.x, startCheckPoint.y)
            }
        }
    }

}

function atleast(number) {
    let reached = 0
    for (let car of cars) {
        if (car.reached) {
            reached++
        }
    }
    return reached / POP_SIZE >= number / 100
}

function setupWorld() {
    worldResetCounter++
    currentTry = 1
    noiseSeed(random() * 100);
    walls.length = 0
    greenWalls.length = 0
    startCheckPoint = new StartCheckPoint(0, 0)
    endCheckPoint = new EndCheckPoint(0, 0)
    checkPoints.length = 0

    noiseMax = NOISE

    let leftWalls = []
    let rightWalls = []

    let greenRadius = []

    let c = 0

    for (let k = 0; k <= 2 * PI; k += radians(5)) {
        xoff = map(cos(k), -1, 1, 0, noiseMax)
        yoff = map(sin(k), -1, 1, 0, noiseMax)

        r = map(noise(xoff, yoff), 0, 1, 50, height / 2)
        x = r * cos(k) + width / 2
        y = r * sin(k) + height / 2

        if (c == 1) {
            startCheckPoint.x = x
            startCheckPoint.y = y
        }
        if (c == 70) {
            endCheckPoint.x = x
            endCheckPoint.y = y
        }

        checkPoints.push(new CheckPoint(x, y))
        greenRadius.push([r, k])

        x = (r - WALL_WIDTH) * cos(k) + width / 2
        y = (r - WALL_WIDTH) * sin(k) + height / 2
        leftWalls.push([x, y])

        x = (r + WALL_WIDTH) * cos(k) + width / 2
        y = (r + WALL_WIDTH) * sin(k) + height / 2
        rightWalls.push([x, y])

        c += 1
    }
    walls.push(new Boundary(leftWalls[0][0], leftWalls[0][1],
        rightWalls[0][0], rightWalls[0][1]))

    for (var i = 1; i < leftWalls.length; i++) {
        walls.push(new Boundary(
            leftWalls[i - 1][0], leftWalls[i - 1][1],
            leftWalls[i][0], leftWalls[i][1]
        ))
        walls.push(new Boundary(
            rightWalls[i - 1][0], rightWalls[i - 1][1],
            rightWalls[i][0], rightWalls[i][1]
        ))

        greenWalls = greenRadius.map(arr => {
            rad = arr[0] - 10
            ang = arr[1]
            x1 = width / 2 + rad * cos(ang)
            y1 = height / 2 + rad * sin(ang)

            rad = arr[0] + 10
            ang = arr[1]
            x2 = width / 2 + rad * cos(ang)
            y2 = height / 2 + rad * sin(ang)
            return new GreenWall(x1, y1, x2, y2)
        })

    }

    for (let i = 0; i < POP_SIZE; i++) {
        cars[i] = new Car(startCheckPoint.x, startCheckPoint.y)
    }

}

function drawWorld() {
    drawCheckPointsAndWalls()
    drawCars()
}

function drawCheckPointsAndWalls() {
    drawWalls()
    if (DRAW_GREEN_WALLS) {
        drawGreenWalls()
        drawCheckPoints()
    }
    drawStats()
    drawNN()
}

function drawNN() {
    push()
    translate(100, 500)
    fill(255)

    firstLayer = [[0, 50], [0, 125], [0, 200], [0, 275], [0, 350]]
    secondLayer = [[150, 50], [150, 125], [150, 200], [150, 275], [150, 350]]
    thirdLayer = [[300, 100], [300, 200], [300, 300]]

    weights = neat.creatures[maxCar].getWeightsForLayer(1)
    for (let i = 0; i < firstLayer.length; i++) {
        let firstLayerNode = firstLayer[i]
        for (let j = 0; j < secondLayer.length; j++) {
            let secondLayerNode = secondLayer[j]
            strokeWeight(map(weights[i][j], 0, 1, 0, 2))
            line(firstLayerNode[0], firstLayerNode[1], secondLayerNode[0], secondLayerNode[1])
        }
    }

    weights = neat.creatures[maxCar].getWeightsForLayer(2)
    for (let i = 0; i < secondLayer.length; i++) {
        let secondLayerNode = secondLayer[i]
        for (let j = 0; j < thirdLayer.length; j++) {
            let thirdLayerNode = thirdLayer[j]
            strokeWeight(map(weights[i][j], 0, 1, 0, 2))
            line(secondLayerNode[0], secondLayerNode[1], thirdLayerNode[0], thirdLayerNode[1])
        }
    }


    strokeWeight(1)
    inputs = neat.creatures[maxCar].getNodeValuesForLayer(1)
    //firstLayer
    for (let i = 0; i < firstLayer.length; i++) {
        let node = firstLayer[i]
        let nodeColor = color("red")
        nodeColor.setAlpha(map(inputs[i], -1, SENSOR_DISTANCE, 150, 255))
        fill(nodeColor)
        ellipse(node[0], node[1], 25)
    }

    hidden = neat.creatures[maxCar].getNodeValuesForLayer(2)
    //secondLayer
    for (let i = 0; i < secondLayer.length; i++) {
        let node = secondLayer[i]
        let nodeColor = color("green")
        nodeColor.setAlpha(map(hidden[i], 0, 1, 100, 255))
        fill(nodeColor)
        ellipse(node[0], node[1], 25)
    }


    output = neat.creatures[maxCar].getNodeValuesForLayer(3)
    noFill()
    //thirdLayer
    for (let i = 0; i < thirdLayer.length; i++) {
        let node = thirdLayer[i]
        ellipse(node[0], node[1], 25)
    }



    strokeWeight(1)

    decisions = neat.creatures[maxCar].getNodeValuesForLayer(3)
    let nodeColor = color("blue")
    if (decisions[0] > 0.5) {
        //go left
        nodeColor.setAlpha(map(decisions[0], 0.5, 1, 150, 255))
        fill(nodeColor)
        ellipse(thirdLayer[0][0], thirdLayer[0][1], 25)
    }
    else if (decisions[1] > 0.5) {
        //go right
        nodeColor.setAlpha(map(decisions[1], 0.5, 1, 150, 255))
        fill(nodeColor)
        ellipse(thirdLayer[1][0], thirdLayer[1][1], 25)
    }

    //go forward
    nodeColor = color("blue")
    nodeColor.setAlpha(map(decisions[2], 0, 1, 0, 255))
    fill(nodeColor)
    ellipse(thirdLayer[2][0], thirdLayer[2][1], 25)

    pop()

}
function drawStats() {
    fill(200)
    strokeWeight(1)
    textSize(30)

    text(`Best score: ${ceil(maxScore)}`, 100, 100)

    let carsReached = 0
    let carsCrashed = 0
    let carsTrying = 0
    for (let i = 0; i < POP_SIZE; i++) {
        let car = cars[i]

        if (car.reached) {
            carsReached += 1
            continue
        }
        if (car.crashed) {
            carsCrashed += 1
            continue
        }

        carsTrying += 1
    }
    text(`Reached: ${carsReached}`, 100, 200)
    text(`Crashed: ${carsCrashed}`, 100, 250)
    text(`Trying: ${carsTrying}`, 100, 300)
    text(`Current Level: ${worldResetCounter}`, 100, 400)
    text(`Try number: ${currentTry}`, 100, 450)
}
function drawCars() {
    cars.forEach(_ => _.draw())

    maxScore = -Infinity

    for (let i = 0; i < POP_SIZE; i++) {
        let car = cars[i]
        if (car.crashed) continue
        if (car.score > maxScore) {
            maxCar = i
            maxScore = car.score
        }
    }
    cars[maxCar].draw(true)
}

function drawCheckPoints() {
    startCheckPoint.draw()
    endCheckPoint.draw()
    checkPoints.forEach(_ => _.draw())
}

function drawWalls() {
    walls.forEach(_ => _.draw())
}

function drawGreenWalls() {
    greenWalls.forEach(_ => _.draw())
}

function controls() {
    if (keyIsDown(LEFT_ARROW)) {
        DRAW_GREEN_WALLS = !DRAW_GREEN_WALLS
        // DRAW_RAYS = !DRAW_RAYS
    }
    if (keyIsDown(UP_ARROW)) {
        importModelFnc()
    }
    if (keyIsDown(DOWN_ARROW)) {
        trainNewModelFnc()
    }
    if (keyIsDown(67)) {
        cars.forEach(car => {
            if (car.crashed) return
            car.score = 0
            car.crashed = true
        })
    }
    if (keyIsDown(83)) {
        console.log(neat.export())
    }
}

function setupNN() {
    config = {
        model: [
            { nodeCount: 5, type: "input" },
            { nodeCount: 5, activationfunc: activation.SIGMOID },
            { nodeCount: 3, type: "output", activationfunc: activation.SIGMOID }
        ],
        mutationRate: 0.05,
        crossoverMethod: crossover.SLICE,
        mutationMethod: mutate.RANDOM,
        populationSize: POP_SIZE
    };
    neat = new NEAT(config)
}