let gl;
let geometry;
let env;
let renderer;
let deferredRenderer;
let forwardRenderer;
let parallaxRenderer;
let renderLayer;
let fpsMeter;

function initBuffers(model) {
    model.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices.data), gl.STATIC_DRAW);
    model.vertexBuffer.itemSize = model.vertices.itemSize;
    model.vertexBuffer.numItems = model.vertices.numItems;

    model.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.colors.data), gl.STATIC_DRAW);
    model.colorBuffer.itemSize = model.colors.itemSize;
    model.colorBuffer.numItems = model.colors.numItems;

    model.normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals.data), gl.STATIC_DRAW);
    model.normalsBuffer.itemSize = model.normals.itemSize;
    model.normalsBuffer.numItems = model.normals.numItems;

    model.texcoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords.data), gl.STATIC_DRAW);
    model.texcoordsBuffer.itemSize = model.texcoords.itemSize;
    model.texcoordsBuffer.numItems = model.texcoords.numItems;

    if (model.tangents) {
        model.tangentsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.tangentsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.tangents.data), gl.STATIC_DRAW);
        model.tangentsBuffer.itemSize = model.tangents.itemSize;
        model.tangentsBuffer.numItems = model.tangents.numItems;
    }

    if (model.bitangents) {
        model.bitangentsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.bitangentsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.bitangents.data), gl.STATIC_DRAW);
        model.bitangentsBuffer.itemSize = model.bitangents.itemSize;
        model.bitangentsBuffer.numItems = model.bitangents.numItems;
    }
}

function initHandlers() {

    let spacepressed = false;

    document.onkeypress = function (ev) {
        if (ev.keyCode === 32) {
            spacepressed = true;
        }
    };

    document.onkeyup = function (ev) {
        if (ev.keyCode === 32) {
            spacepressed = false;
        }
    };

    document.onmousemove = function (ev) {
        if (spacepressed) {
            let dx = ev.movementX / 8;
            let dy = ev.movementY / 8;
            geometry.rotateCamera(-dx, dy);
        }
    };

    document.onkeydown = function (e) {
        console.dir(e.keyCode);
        e = e || window.event;

        const translationDelta = 0.4;

        if (e.keyCode === 38) {
            // up arrow
            geometry.rotateCamera(0, -1);
        }
        else if (e.keyCode === 40) {
            // down arrow
            geometry.rotateCamera(0, 1);
        }
        else if (e.keyCode === 37) {
            // left arrow
            geometry.rotateCamera(1, 0);
        }
        else if (e.keyCode === 39) {
            // right arrow
            geometry.rotateCamera(-1, 0);
        }
        else if (e.keyCode === 87) {
            // w key
            geometry.translateCamera([0, 0, -translationDelta]);
        }
        else if (e.keyCode === 83) {
            // s key
            geometry.translateCamera([0, 0, translationDelta]);
        }
        else if (e.keyCode === 68) {
            // d key
            geometry.translateCamera([translationDelta, 0, 0]);
        }
        else if (e.keyCode === 65) {
            // a key
            geometry.translateCamera([-translationDelta, 0, 0]);
        }
        else if (e.keyCode === 82) {
            // r key
            geometry.translateCamera([0, translationDelta, 0]);
        }
        else if (e.keyCode === 70) {
            // f key
            geometry.translateCamera([0, -translationDelta, 0]);
        }
        else if (e.keyCode === 71) {
            // g key
            dumpGeometry(geometry);
        }
        else if (e.keyCode === 72) {
            // g key
            flushGeometry();
            geometry = new Geometry();
        }
        else {
            env.debug(e.keyCode);
        }

    };


    const sliderNumLights = document.getElementById("lightsRange");
    const outputNumLights = document.getElementById("lightsValue");
    sliderNumLights.value = env.getLightsNum();
    outputNumLights.innerHTML = sliderNumLights.value;

    sliderNumLights.oninput = function() {
        outputNumLights.innerHTML = this.value;
        env.setLightNum(this.value);
        renderer.renderFrame(env, geometry, renderLayer);
    };


    document.getElementById("fractal-canvas").addEventListener('wheel', function(e) {
        geometry.translateCamera([0, 0, e.deltaY / 16]);
    });
}

function handleLayerChange(radioButton) {
    renderLayer = Number.parseInt(radioButton.value);
}

function handleRendererChange(radioButton) {
    renderer = Number.parseInt(radioButton.value) === 0 ? deferredRenderer : forwardRenderer;
}

function tick() {
    fpsMeter.invoke();
    const fps = fpsMeter.getFps();
    document.getElementById("fps-rate").innerHTML = fps;
    // -> renderer.render();
    renderer.renderFrame(env, geometry, renderLayer);
    // env.animate();
    env.animateModels();
    requestAnimationFrame(tick);
}

// отладочной отрисовки каждой из текстур gbuffer'а
// Уменьшение/увеличение количества источников света
// переключение между forward render и deferred render

function webGLStart() {
    gl = initGL();
    geometry = loadGeometry();
    env = loadEnvironment();
    deferredRenderer = new DeferredRenderingStrategy(gl);
    forwardRenderer = new ForwardRenderingStrategy(gl);
    parallaxRenderer = new ParallaxRenderingStrategy(gl);
    renderer = parallaxRenderer;
    fpsMeter = new FpsMeter();

    renderLayer = 0;

    // не зависит от способа рендера
    env.getModels().forEach(initBuffers);

    // не зависит от способа рендера
    initHandlers();

    // не зависит от способа рендера (или зависит?)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthMask(false);
    // gl.depthFunc(gl.LESS);

    tick();
}
