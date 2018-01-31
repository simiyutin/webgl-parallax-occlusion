function getShader(gl, shaderName) {
    let shader;
    let source;
    source = loadFile(`/src/shaders/${shaderName}.glsl`);
    if (shaderName.indexOf("vertex") !== -1) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else if (shaderName.indexOf("fragment") !== -1) {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initGL() {

    let canvas = document.getElementById("fractal-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let gl;

    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }

    return gl;
}

function flatten(array) {
    return Array.prototype.concat.apply([], array.map(el => Array.from(el)));
}