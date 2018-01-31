class DeferredRenderingStrategy {
    constructor(gl) {
        this.gl = gl;
        this.texWidth = gl.viewportWidth;
        this.texHeight = gl.viewportHeight;
        this.drawBufferExt = gl.getExtension('WEBGL_draw_buffers');
        if (!this.drawBufferExt) {
            throw "error: drawBuffers extension unavailable";
        }

        if (!gl.getExtension('OES_texture_float') || !gl.getExtension("OES_texture_float_linear")) {
            throw "error: float textures datatype extension unavailable";
        }

        this.quadModel = {
            buffer: gl.createBuffer(),
            data: new Float32Array([
                -1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0,  1.0, 0.0,
                -1.0,  1.0, 0.0,
                1.0, -1.0, 0.0,
                1.0,  1.0, 0.0])
        };

        this.gBufferProgram = null;
        this.gBufferFrameBuffer = null;
        this.normalTexture = null;
        this.positionTexture = null;
        this.colorTexture = null;

        this.composeProgram = null;

        this.initProgram('gBuffer');
        this.initGBufferFrameBuffer();

        this.initProgram('compose');
    }

    // region interface
    renderFrame(env, geometry, renderLayer) {
        this.drawGBuffer(env, geometry);
        this.drawCompose(env, geometry, renderLayer);
    }
    // endregion

    // region private

    initProgram(name) {
        const gl = this.gl;
        const fragmentShader = getShader(gl, `deferred_${name}_fragment`);
        const vertexShader = getShader(gl, `deferred_${name}_vertex`);

        const program = this[`${name}Program`] = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this[`initProperties_${name}`](program);
    }

    initProperties_gBuffer(program) {
        const gl = this.gl;
        program.aVertexColor = gl.getAttribLocation(program, "aVertexColor");
        program.aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
        program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        program.uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
        program.uPMatrix = gl.getUniformLocation(program, "uPMatrix");
        program.uNMatrix = gl.getUniformLocation(program, "uNMatrix");
    }

    initProperties_compose(program) {
        const gl = this.gl;
        program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        program.uColorSampler = gl.getUniformLocation(program, "uColorSampler");
        program.uPositionSampler = gl.getUniformLocation(program, "uPositionSampler");
        program.uNormalSampler = gl.getUniformLocation(program, "uNormalSampler");
        program.uLightPos = gl.getUniformLocation(program, "uLightPos");
        program.uLights = gl.getUniformLocation(program, "uLights");
        program.uLightsSize = gl.getUniformLocation(program, "uLightsSize");
        program.uLightColors = gl.getUniformLocation(program, "uLightColors");
        program.uColorsSize = gl.getUniformLocation(program, "uColorsSize");
        program.uRenderLayer = gl.getUniformLocation(program, "uRenderLayer");
    }

    initGBufferFrameBuffer() {
        const gl = this.gl;
        const ext = this.drawBufferExt;

        let frameBuffer = this.gBufferFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        this.colorTexture = gl.createTexture();
        this.positionTexture = gl.createTexture();
        this.normalTexture = gl.createTexture();

        this.colorTexture = createTexture(gl, this.texWidth, this.texHeight   , gl.RGBA, gl.RGBA, gl.FLOAT);
        this.positionTexture = createTexture(gl, this.texWidth, this.texHeight, gl.RGBA, gl.RGBA, gl.FLOAT);
        this.normalTexture = createTexture(gl, this.texWidth, this.texHeight  , gl.RGBA, gl.RGBA, gl.FLOAT);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.colorTexture   , 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.positionTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTexture  , 0);

        ext.drawBuffersWEBGL([
            ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
            ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
            ext.COLOR_ATTACHMENT2_WEBGL // gl_FragData[2]
        ]);

        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.texWidth, this.texHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw "error: framebuffer incomplete";
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawGBuffer(env, geometry) {
        const models = env.getModels();
        const gl = this.gl;
        const program = this.gBufferProgram;

        gl.useProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.gBufferFrameBuffer);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        geometry.updateMVPMatrix(gl.viewportWidth / gl.viewportHeight);

        const mvMatrix = geometry.getMVMatrix();

        models.forEach(model => {
            const mvMatrixCopy = copyMatrix4(mvMatrix);
            model.updateMVMatrix(mvMatrixCopy);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            if (program.aVertexPosition !== -1) {
                gl.enableVertexAttribArray(program.aVertexPosition);
                gl.vertexAttribPointer(program.aVertexPosition, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
            if (program.aVertexColor !== -1) {
                gl.enableVertexAttribArray(program.aVertexColor);
                gl.vertexAttribPointer(program.aVertexColor, model.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.normalsBuffer);
            if (program.aVertexNormal !== -1) {
                gl.enableVertexAttribArray(program.aVertexNormal);
                gl.vertexAttribPointer(program.aVertexNormal, model.normalsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.uniformMatrix4fv(program.uPMatrix, false, geometry.getPMatrix());
            gl.uniformMatrix4fv(program.uMVMatrix, false, mvMatrixCopy);
            gl.uniformMatrix3fv(program.uNMatrix, false, toNormalMVMatrix(mvMatrixCopy));

            gl.drawArrays(gl.TRIANGLES, 0, model.vertexBuffer.numItems);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawCompose(env, geometry, renderLayer) {
        const gl = this.gl;
        const program = this.composeProgram;

        gl.useProgram(program);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadModel.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.quadModel.data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(program.aVertexPosition);
        gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.uniform1i(program.uColorSampler, 0); // wtf?
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);

        gl.uniform1i(program.uPositionSampler, 1); // wtf?
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);

        gl.uniform1i(program.uNormalSampler, 2); // wtf?
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);

        const lightPosArray = geometry.applyMVMatrix(env.getLightsPosArray());
        gl.uniform3fv(program.uLights, flatten(lightPosArray));
        gl.uniform1i(program.uLightsSize, env.getLightsNum());

        const lightColors = env.getLightsColors();
        gl.uniform3fv(program.uLightColors, flatten(lightColors));
        gl.uniform1i(program.uColorsSize, env.getLightsNum());

        const lightPos = geometry.applyMVMatrix(env.getLightPos());
        gl.uniform3fv(program.uLightPos, lightPos);

        gl.uniform1i(program.uRenderLayer, renderLayer);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    // endregion
}

function createTexture(gl, width, height, internalFormat, format, type) {
    const texture = gl.createTexture();
    texture.width = width;
    texture.height = height;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    {
        const level = 0;
        const border = 0;
        const data = null;
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            data);
    }
    return texture;
}