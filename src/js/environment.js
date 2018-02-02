const MAX_LIGHTS_NUM = 256;

class Environment {
    constructor(models, lights, lightsColors) {
        this.lightPos = vec3.create([0, 0, 0]);
        this.lightDir = vec3.create([-2, 10, 1]);
        this.ambientColor = vec3.create([0.1, 0.1, 0.1]);
        this.shift = vec3.create([0, 0, 0]);
        this.shiftDelta = vec3.create([0.5, 0, 0]);
        this.shiftThreshold = 20;
        this.lights = lights;
        this.lightsColors = lightsColors;
        this.lightsNum = 100;
        this.models = models;
    }

    animate() {
        vec3.add(this.shift, this.shiftDelta);
        const diff = vec3.create();
        vec3.subtract(this.lightPos, this.shift, diff);
        if (vec3.length(diff) > this.shiftThreshold) {
            vec3.negate(this.shiftDelta);
        }
    }

    animateModels() {
        this.models.forEach(m => m.animate());
    }

    getLightPos() {
        const result = vec3.create();
        vec3.add(this.lightPos, this.shift, result);
        return result;
    }

    getLightsPosArray() {
        return this.lights;
    }

    getLightsNum() {
        return this.lightsNum;
    }

    getLightsColors() {
        return this.lightsColors;
    }

    getModels() {
        return this.models;
    }

    getLightDir() {
        const normalised = vec3.create();
        vec3.normalize(this.lightDir, normalised);
        return normalised;
    }

    getAmbientColor() {
        return this.ambientColor;
    }

    setLightNum(num) {
        if (num < 0 || num > MAX_LIGHTS_NUM) {
            console.log(`cannot set more than ${MAX_LIGHTS_NUM} or less than 0 lights! got ${num}`);
            return;
        }
        this.lightsNum = num;
    }

    debug(keyCode) {
        switch (keyCode) {
            case 100:
                this.lightDir[0]--;
                break;
            case 102:
                this.lightDir[0]++;
                break;
            case 104:
                this.lightDir[2]--;
                break;
            case 98:
                this.lightDir[2]++;
                break;
            default:
                console.log(keyCode);
                break;
        }
    }
}

function getConcentricPositions(radius, quantity, y) {
    const angleStepRad = deg2rad(360 / quantity);
    const result = [];
    for (let i = 0; i < quantity; ++i) {
        let x = Math.cos(i * angleStepRad) * radius;
        let z = Math.sin(i * angleStepRad) * radius;
        result.push(vec3.create([x, y, z]));
    }
    return result;
}


function loadStaticBunny(color, shift, spec) {
    let bunnyStatic = loadBunny(color);
    bunnyStatic.shift = shift;
    bunnyStatic.animate = function() {};
    bunnyStatic.updateMVMatrix = function(mvMatrix) {
        mat4.translate(mvMatrix, this.shift);
    };
    bunnyStatic.specularColor = spec;
    return bunnyStatic;
}

function scene1_models() {
    const models = [];
    let bunnyDynamic = loadBunny();
    bunnyDynamic.shift = [5, 0, -2];
    bunnyDynamic.angle = 0;
    bunnyDynamic.animate = function() {
        bunnyDynamic.angle = (bunnyDynamic.angle + 1) % 360;
    };
    bunnyDynamic.updateMVMatrix = function(mvMatrix) {
        mat4.translate(mvMatrix, this.shift);
        mat4.rotate(mvMatrix, deg2rad(bunnyDynamic.angle), [0, 1, 0]);
    };
    bunnyDynamic.specularColor = [0, 0.6, 0.6];
    models.push(bunnyDynamic);

    let pyramidDynamic = loadPyramid();
    pyramidDynamic.shift = [-5, 1, -2];
    pyramidDynamic.angle = 0;
    pyramidDynamic.animate = function() {
        pyramidDynamic.angle = (pyramidDynamic.angle - 2) % 360;
    };
    pyramidDynamic.updateMVMatrix = function(mvMatrix) {
        mat4.translate(mvMatrix, this.shift);
        mat4.rotate(mvMatrix, deg2rad(pyramidDynamic.angle), [0, 1, 0]);
    };
    pyramidDynamic.specularColor = [0, 0, 0];
    models.push(pyramidDynamic);

    let bunnyStatic = loadStaticBunny([255 / 255, 105 / 255, 180 / 255, 1], [5, 0, 2], [0, 0, 0]);
    models.push(bunnyStatic);

    let plane = loadPlane();
    plane.shift = [0, -1, 0];
    plane.animate = function() {};
    plane.updateMVMatrix = function(mvMatrix) {
        mat4.translate(mvMatrix, this.shift);
    };
    plane.specularColor = [0, 0, 0];
    models.push(plane);
    return models;
}

function scene1_lights() {
    return getConcentricPositions(10, 10, 1);
}

const cube = 20;
const num = 10;

function scene2_models() {
    const models = [];
    const bun = shift =>  loadStaticBunny([0.5, 0.5, 0.5, 1], shift, [0, 0, 0]);
    for (let x = - cube * 0.5; x < cube * 0.5; x += cube / num) {
        for (let y = 0; y < cube; y += cube / num) {
            for (let z = - cube * 0.5; z < cube * 0.5; z += cube / num) {
                models.push(bun([x, y, z]))
            }
        }
    }


    // todo вернуть это и сделать новую функцию для третьей сцены
    // let plane = loadPlane();
    // plane.shift = [0, -1, 0];
    // plane.animate = function() {};
    // plane.updateMVMatrix = function(mvMatrix) {
    //     mat4.translate(mvMatrix, this.shift);
    // };
    // plane.specularColor = [0, 0, 0];
    // models.push(plane);
    return models;
}

function scene2_lights_determenistic() {
    const result = [];
    const shift = (cube / num) / 2;
    for (let x = - cube * 0.5; x < cube * 0.5; x += cube / num) {
        for (let y = 0; y < cube; y += cube / num) {
            for (let z = - cube * 0.5; z < cube * 0.5; z += cube / num) {
                result.push(vec3.create([x + -0.5 * shift, y + shift, z + 1.1 * shift]))
            }
        }
    }
    return result;
}

function scene2_lights() {
    const result = [];
    for (let i = 0; i < MAX_LIGHTS_NUM; ++i) {
        const x = (Math.random() - 0.5) * cube;
        const y = Math.random() * cube;
        const z = (Math.random() - 0.5) * cube;
        result.push(vec3.create([x, y, z]))
    }
    return result;
}

function scene2_lightsColors() {
    const palette = [
        // [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0]
    ];

    let result = [];

    for (let i = 0; i < MAX_LIGHTS_NUM; ++i) {
        result = result.concat(palette);
    }

    shuffleArray(result);

    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function loadEnvironment() {
    const lights = scene2_lights();
    const models = scene2_models(); // todo сделать одного кролика, но 125 раз рисуемого
    const colors = scene2_lightsColors();
    return new Environment(models, lights, colors);
}