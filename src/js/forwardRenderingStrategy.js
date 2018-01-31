class ForwardRenderingStrategy {
    constructor (gl) {
        this.gl = gl;
        this.mainProgram = null;
        this.depthProgram = null;
        this.depthFrameBuffer = null;
        this.depthTexture = null;

        this.initMainShaders();
        this.initDepthShaders();
        this.initDepthStructures();

    }

    // region interface
    renderFrame(env, geometry, renderLayer) {
        this.drawShadowMap(env, geometry);
        this.drawScene(env, geometry, renderLayer);
    }
    // endregion

    // region private
    initMainShaders() {
        const gl = this.gl;
        const fragmentShader = getShader(gl, "fragmentMain");
        const vertexShader = getShader(gl, "vertexMain");
        let mainProgram = this.mainProgram = gl.createProgram();

        gl.attachShader(mainProgram, vertexShader);
        gl.attachShader(mainProgram, fragmentShader);
        gl.linkProgram(mainProgram);

        if (!gl.getProgramParameter(mainProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        mainProgram.aVertexPosition = gl.getAttribLocation(mainProgram, "aVertexPosition");
        mainProgram.aVertexColor = gl.getAttribLocation(mainProgram, "aVertexColor");
        mainProgram.aVertexNormal = gl.getAttribLocation(mainProgram, "aVertexNormal");

        mainProgram.uPMatrix = gl.getUniformLocation(mainProgram, "uPMatrix");
        mainProgram.uMVMatrix = gl.getUniformLocation(mainProgram, "uMVMatrix");
        mainProgram.uNMatrix = gl.getUniformLocation(mainProgram, "uNMatrix");
        mainProgram.uLightMVMatrix = gl.getUniformLocation(mainProgram, "uLightMVMatrix");
        mainProgram.uLightPMatrix = gl.getUniformLocation(mainProgram, "uLightPMatrix");
        mainProgram.uAmbientColor = gl.getUniformLocation(mainProgram, "uAmbientColor");
        mainProgram.uLightPos = gl.getUniformLocation(mainProgram, "uLightPos");
        mainProgram.uLights = gl.getUniformLocation(mainProgram, "uLights");
        mainProgram.uLightsSize = gl.getUniformLocation(mainProgram, "uLightsSize");
        mainProgram.uLightColors = gl.getUniformLocation(mainProgram, "uLightColors");
        mainProgram.uColorsSize = gl.getUniformLocation(mainProgram, "uColorsSize");
        mainProgram.uLightDir = gl.getUniformLocation(mainProgram, "uLightDir");
        mainProgram.uSpecularColor = gl.getUniformLocation(mainProgram, "uSpecularColor");
        mainProgram.uSampler = gl.getUniformLocation(mainProgram, "uSampler");
        mainProgram.uRenderLayer = gl.getUniformLocation(mainProgram, "uRenderLayer");
    }

    initDepthShaders() {
        const gl = this.gl;
        const fragmentShader = getShader(gl, "fragmentDepth");
        const vertexShader = getShader(gl, "vertexDepth");

        let depthProgram = this.depthProgram = gl.createProgram();
        gl.attachShader(depthProgram, vertexShader);
        gl.attachShader(depthProgram, fragmentShader);
        gl.linkProgram(depthProgram);

        if (!gl.getProgramParameter(depthProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        depthProgram.aVertexPosition = gl.getAttribLocation(depthProgram, "aVertexPosition");

        depthProgram.uPMatrix = gl.getUniformLocation(depthProgram, "uPMatrix");
        depthProgram.uMVMatrix = gl.getUniformLocation(depthProgram, "uMVMatrix");
    }

    initDepthStructures() {

        const gl = this.gl;
        gl.getExtension('WEBGL_depth_texture');

        let depthFrameBuffer = this.depthFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);

        let depthTexture = this.depthTexture = gl.createTexture();
        depthTexture.width = 1024;
        depthTexture.height = 1024;
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        {
            const level = 0;
            const internalFormat = gl.RGBA;
            const border = 0;
            const format = internalFormat;
            const type = gl.UNSIGNED_BYTE;
            const data = null;
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                depthTexture.width,
                depthTexture.height,
                border,
                format,
                type,
                data);
        }

        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(
            gl.RENDERBUFFER,
            gl.DEPTH_COMPONENT16,
            depthTexture.width,
            depthTexture.height);

        {
            const attachment = gl.COLOR_ATTACHMENT0;
            const textarget = gl.TEXTURE_2D;
            const texture = depthTexture;
            const level = 0;
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                attachment,
                textarget,
                texture,
                level);
        }

        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            renderBuffer);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw "azaza lalka: framebuffer incomplete";
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawScene(env, geometry, renderLayer) {
        const models = env.getModels();
        const gl = this.gl;
        const mainProgram = this.mainProgram;
        const depthTexture = this.depthTexture;

        gl.useProgram(mainProgram);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        geometry.updateMVPMatrix(gl.viewportWidth / gl.viewportHeight);
        geometry.updateMVPLightMatrix(env.getLightDir());

        const lightDir = vec3.create(env.getLightDir());
        const rotationMat = mat4.create();
        const mvMatrix = geometry.getMVMatrix();
        mat4.toRotationMat(mvMatrix, rotationMat);
        mat4.multiplyVec3(rotationMat, lightDir);
        const lightPos = vec3.create(env.getLightPos());
        mat4.multiplyVec3(mvMatrix, lightPos);

        models.forEach(model => {
            const mvMatrixCopy = copyMatrix4(mvMatrix);
            const mvLightMatrixCopy = copyMatrix4(geometry.getMVLightMatrix());
            model.updateMVMatrix(mvMatrixCopy);
            model.updateMVMatrix(mvLightMatrixCopy);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            if (mainProgram.aVertexPosition !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexPosition);
                gl.vertexAttribPointer(mainProgram.aVertexPosition, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
            if (mainProgram.aVertexColor !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexColor);
                gl.vertexAttribPointer(mainProgram.aVertexColor, model.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.normalsBuffer);
            if (mainProgram.aVertexNormal !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexNormal);
                gl.vertexAttribPointer(mainProgram.aVertexNormal, model.normalsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.uniformMatrix4fv(mainProgram.uPMatrix, false, geometry.getPMatrix());
            gl.uniformMatrix4fv(mainProgram.uMVMatrix, false, mvMatrixCopy);
            gl.uniformMatrix4fv(mainProgram.uLightPMatrix, false, geometry.getPLightMatrix());
            gl.uniformMatrix4fv(mainProgram.uLightMVMatrix, false, mvLightMatrixCopy);
            gl.uniformMatrix3fv(mainProgram.uNMatrix, false, toNormalMVMatrix(mvMatrixCopy));


            const lightPosArray = geometry.applyMVMatrix(env.getLightsPosArray());
            gl.uniform3fv(mainProgram.uLights, flatten(lightPosArray));
            gl.uniform1i(mainProgram.uLightsSize, env.getLightsNum());

            const lightColors = env.getLightsColors();
            gl.uniform3fv(mainProgram.uLightColors, flatten(lightColors));
            gl.uniform1i(mainProgram.uColorsSize, env.getLightsNum());

            gl.uniform3fv(mainProgram.uLightPos, lightPos);
            gl.uniform3fv(mainProgram.uLightDir, lightDir);
            gl.uniform3fv(mainProgram.uAmbientColor, env.getAmbientColor());
            gl.uniform3fv(mainProgram.uSpecularColor, model.specularColor);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, depthTexture);
            gl.uniform1i(mainProgram.uSampler, 0); // wtf?

            gl.uniform1i(mainProgram.uRenderLayer, renderLayer);

            gl.drawArrays(gl.TRIANGLES, 0, model.vertexBuffer.numItems);
        });

    }

    drawShadowMap(env, geometry) {
        const models = env.getModels();
        const gl = this.gl;
        const depthProgram = this.depthProgram;
        const depthFrameBuffer = this.depthFrameBuffer;
        const depthTexture = this.depthTexture;

        gl.useProgram(depthProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);
        gl.viewport(0, 0, depthTexture.width, depthTexture.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        geometry.updateMVPLightMatrix(env.getLightDir());

        models.forEach(model => {
            const mvLightMatrixCopy = copyMatrix4(geometry.getMVLightMatrix());
            model.updateMVMatrix(mvLightMatrixCopy);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            if (depthProgram.aVertexPosition !== -1) {
                gl.enableVertexAttribArray(depthProgram.aVertexPosition);
                gl.vertexAttribPointer(depthProgram.aVertexPosition, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.uniformMatrix4fv(depthProgram.uPMatrix, false, geometry.getPLightMatrix());
            gl.uniformMatrix4fv(depthProgram.uMVMatrix, false, mvLightMatrixCopy);
            gl.drawArrays(gl.TRIANGLES, 0, model.vertexBuffer.numItems);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // endregion
}