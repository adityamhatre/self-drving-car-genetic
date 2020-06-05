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

    SIMULATION_SPEED = { value: () => 10 }//createSlider(1, MAX_SIMULATION_SPEED, 1)

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
                // setupWorld()
                // return
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
                // setupWorld()
            } else {
                currentTry += 1
                if (currentTry > MAX_TRIES_FOR_LEVEL) {
                    // setupWorld()
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


    leftWalls.push([244, 166])
    rightWalls.push([200, 90])

    leftWalls.push([244, 550])
    rightWalls.push([200, 700])

    leftWalls.push([376, 681])
    rightWalls.push([440, 950])

    leftWalls.push([461, 681])
    rightWalls.push([600, 950])

    leftWalls.push([602, 550])
    rightWalls.push([720, 830])

    leftWalls.push([662, 681])
    rightWalls.push([770, 950])

    leftWalls.push([1049, 681])
    rightWalls.push([1430, 950])

    leftWalls.push([1049, 252])
    rightWalls.push([1430, 170])

    leftWalls.push([798, 252])
    rightWalls.push([900, 170])

    leftWalls.push([798, 391])
    rightWalls.push([900, 370])

    leftWalls.push([614, 391])
    rightWalls.push([880, 370])

    leftWalls.push([614, 247])
    rightWalls.push([880, 170])

    leftWalls.push([426, 247])
    rightWalls.push([660, 170])

    leftWalls.push([426, 166])
    rightWalls.push([660, 90])

    leftWalls.push([244, 166])
    rightWalls.push([200, 90])

    for (var i = 0; i < leftWalls.length; i++) {
        leftWalls[i][0] += 200
        leftWalls[i][1] -= 0

        leftWalls[i][0] *= 1.2
        leftWalls[i][1] *= 1.2

        rightWalls[i][0] += 200
        rightWalls[i][1] -= 0

    }

    const factor = 100
    for (var i = 166; i <= 700; i += factor) {
        greenWalls.push(new GreenWall(460, i, 470, i))
    }

    for (var i = 10; i < 200; i += factor) {
        greenWalls.push(new GreenWall(470 + i, 700 + i, 480 + i, 700 + i))
    }

    for (var i = 0; i < 110; i += factor) {
        greenWalls.push(new GreenWall(680 + i, 880, 680 + i, 900))
    }

    for (var i = 10; i < 160; i += factor) {
        greenWalls.push(new GreenWall(780 + i, 900 - i, 790 + i, 900 - i))
    }

    for (var i = 940; i < 1000; i += factor / 2) {
        greenWalls.push(new GreenWall(i, 2.5 * i - 1600, i + 10, 2.5 * i - 1600))
    }

    for (var i = 0; i < 550; i += factor) {
        greenWalls.push(new GreenWall(1010 + i, 880, 1010 + i, 900))
    }

    for (var i = 870; i >= 250; i -= factor) {
        greenWalls.push(new GreenWall(1550, i, 1570, i))
    }

    for (var i = 50; i < 470; i += factor) {
        greenWalls.push(new GreenWall(1100 + i, 250, 1100 + i, 270))
    }

    
    for (var i = 0; i < 270; i += factor) {
        greenWalls.push(new GreenWall(800 + i, 230, 800 + i, 250))
    }

    for (var i = 0; i < 240; i += factor) {
        greenWalls.push(new GreenWall(600 + i, 140, 600 + i, 160))
    }
    
    for (var i = 290; i <= 420; i += factor) {
        greenWalls.push(new GreenWall(1140, i, 1160, i))
    }

    for (var i = 290; i <= 420; i += factor) {
        greenWalls.push(new GreenWall(1020, i, 1040, i))
    }

    for (var i = 160; i <= 240; i += factor) {
        greenWalls.push(new GreenWall(790, i, 810, i))
    }
    for (var i = 0; i < 160; i += factor) {
        greenWalls.push(new GreenWall(1030 + i, 420, 1030 + i, 440))
    }
    startCheckPoint.x = 460
    startCheckPoint.y = 170

    endCheckPoint.x = 580
    endCheckPoint.y = 150

    for (var i = 1; i < leftWalls.length; i++) {


        walls.push(new Boundary(
            leftWalls[i - 1][0], leftWalls[i - 1][1],
            leftWalls[i][0], leftWalls[i][1]
        ))
        walls.push(new Boundary(
            rightWalls[i - 1][0], rightWalls[i - 1][1],
            rightWalls[i][0], rightWalls[i][1]
        ))
    }

    for (let i = 0; i < POP_SIZE; i++) {
        cars[i] = new Car(startCheckPoint.x, startCheckPoint.y)
    }

}

function drawWorld() {
    strokeWeight(1)
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
    translate(30, 500)
    fill(255)
    stroke(255)

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
    nodeColor.setAlpha(map(decisions[2], 0, 1, 150, 255))
    fill(nodeColor)
    ellipse(thirdLayer[2][0], thirdLayer[2][1], 25)

    pop()

}
function drawStats() {
    fill(200)
    strokeWeight(1)
    textSize(30)

    text(`Best score: ${maxScore}`, 100, 100)

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