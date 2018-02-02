class ParallaxRenderingStrategy {
    constructor(gl) {
        this.gl = gl;
        if (!gl.getExtension('OES_standard_derivatives') || !gl.getExtension('EXT_shader_texture_lod')) {
            throw "error: extension cannot be loaded";
        }
        this.mainProgram = null;
        this.initProgram('main');
        this.colorTexture = this.loadTexture('color');
        this.depthTexture = this.loadTexture('depth');
        this.normalsTexture = this.loadTexture('normals');
    }

    // region interface
    renderFrame(env, geometry) {
        this.drawScene(env, geometry);
    }
    // endregion

    // region private

    drawScene(env, geometry) {
        const models = env.getModels();
        const gl = this.gl;
        const mainProgram = this.mainProgram;
        const colorTexture = this.colorTexture;
        const depthTexture = this.depthTexture;
        const normalsTexture = this.normalsTexture;

        gl.useProgram(mainProgram);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        geometry.updateMVPMatrix(gl.viewportWidth / gl.viewportHeight);

        const lightDir = vec3.create(env.getLightDir());
        const rotationMat = mat4.create();
        const mvMatrix = geometry.getMVMatrix();
        mat4.toRotationMat(mvMatrix, rotationMat);
        mat4.multiplyVec3(rotationMat, lightDir);

        models.forEach(model => {
            const mvMatrixCopy = copyMatrix4(mvMatrix);
            model.updateMVMatrix(mvMatrixCopy);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            if (mainProgram.aVertexPosition !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexPosition);
                gl.vertexAttribPointer(mainProgram.aVertexPosition, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.texcoordsBuffer);
            if (mainProgram.aVertexTexcoord !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexTexcoord);
                gl.vertexAttribPointer(mainProgram.aVertexTexcoord, model.texcoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.normalsBuffer);
            if (mainProgram.aVertexNormal !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexNormal);
                gl.vertexAttribPointer(mainProgram.aVertexNormal, model.normalsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.tangentsBuffer);
            if (mainProgram.aVertexTangent !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexTangent);
                gl.vertexAttribPointer(mainProgram.aVertexTangent, model.tangentsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.bitangentsBuffer);
            if (mainProgram.aVertexBiTangent !== -1) {
                gl.enableVertexAttribArray(mainProgram.aVertexBiTangent);
                gl.vertexAttribPointer(mainProgram.aVertexBiTangent, model.bitangentsBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            // vertex
            gl.uniformMatrix4fv(mainProgram.uPMatrix, false, geometry.getPMatrix());
            gl.uniformMatrix4fv(mainProgram.uMVMatrix, false, mvMatrixCopy);
            gl.uniformMatrix3fv(mainProgram.uNMatrix, false, toNormalMVMatrix(mvMatrixCopy));

            // fragment
            gl.uniform3fv(mainProgram.uLightDir, lightDir);
            gl.uniform3fv(mainProgram.uAmbientColor, env.getAmbientColor());
            gl.uniform3fv(mainProgram.uSpecularColor, model.specularColor);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, colorTexture);
            gl.uniform1i(mainProgram.uColorSampler, 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, depthTexture);
            gl.uniform1i(mainProgram.uDepthSampler, 1);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, normalsTexture);
            gl.uniform1i(mainProgram.uNormalSampler, 2);

            // render
            gl.drawArrays(gl.TRIANGLES, 0, model.vertexBuffer.numItems);
        });
    }

    loadTexture(name) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);

        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        };
        image.src = `http://localhost:8000/textures/${name}.jpg`;

        return texture;
    };

    initProgram(name) {
        const gl = this.gl;
        const fragmentShader = getShader(gl, `parallax_${name}_fragment`);
        const vertexShader = getShader(gl, `parallax_${name}_vertex`);

        const program = this[`${name}Program`] = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this[`initProperties_${name}`](program);
    }

    initProperties_main(program) {
        const gl = this.gl;

        program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        program.aVertexTexcoord = gl.getAttribLocation(program, "aVertexTexcoord");
        program.aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
        program.aVertexTangent = gl.getAttribLocation(program, "aVertexTangent");
        program.aVertexBiTangent = gl.getAttribLocation(program, "aVertexBiTangent");

        program.uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
        program.uPMatrix = gl.getUniformLocation(program, "uPMatrix");
        program.uNMatrix = gl.getUniformLocation(program, "uNMatrix");
        program.uLightDir = gl.getUniformLocation(program, "uLightDir");
        program.uSpecularColor = gl.getUniformLocation(program, "uSpecularColor");
        program.uAmbientColor = gl.getUniformLocation(program, "uAmbientColor");
        program.uColorSampler = gl.getUniformLocation(program, "uColorSampler");
        program.uDepthSampler = gl.getUniformLocation(program, "uDepthSampler");
        program.uNormalSampler = gl.getUniformLocation(program, "uNormalSampler");
    }

    // initProperties_gBuffer(program) {
    //     const gl = this.gl;
    //     program.aVertexColor = gl.getAttribLocation(program, "aVertexColor");
    //     program.aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
    //     program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    //     program.uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
    //     program.uPMatrix = gl.getUniformLocation(program, "uPMatrix");
    //     program.uNMatrix = gl.getUniformLocation(program, "uNMatrix");
    // }
    //
    // initProperties_compose(program) {
    //     const gl = this.gl;
    //     program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    //     program.uColorSampler = gl.getUniformLocation(program, "uColorSampler");
    //     program.uPositionSampler = gl.getUniformLocation(program, "uPositionSampler");
    //     program.uNormalSampler = gl.getUniformLocation(program, "uNormalSampler");
    //     program.uLightPos = gl.getUniformLocation(program, "uLightPos");
    //     program.uLights = gl.getUniformLocation(program, "uLights");
    //     program.uLightsSize = gl.getUniformLocation(program, "uLightsSize");
    //     program.uLightColors = gl.getUniformLocation(program, "uLightColors");
    //     program.uColorsSize = gl.getUniformLocation(program, "uColorsSize");
    //     program.uRenderLayer = gl.getUniformLocation(program, "uRenderLayer");
    // }
    //
    // initGBufferFrameBuffer() {
    //     const gl = this.gl;
    //     const ext = this.drawBufferExt;
    //
    //     let frameBuffer = this.gBufferFrameBuffer = gl.createFramebuffer();
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    //
    //     this.colorTexture = gl.createTexture();
    //     this.positionTexture = gl.createTexture();
    //     this.normalTexture = gl.createTexture();
    //
    //     this.colorTexture = createTexture(gl, this.texWidth, this.texHeight   , gl.RGBA, gl.RGBA, gl.FLOAT);
    //     this.positionTexture = createTexture(gl, this.texWidth, this.texHeight, gl.RGBA, gl.RGBA, gl.FLOAT);
    //     this.normalTexture = createTexture(gl, this.texWidth, this.texHeight  , gl.RGBA, gl.RGBA, gl.FLOAT);
    //
    //     gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.colorTexture   , 0);
    //     gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.positionTexture, 0);
    //     gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTexture  , 0);
    //
    //     ext.drawBuffersWEBGL([
    //         ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
    //         ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
    //         ext.COLOR_ATTACHMENT2_WEBGL // gl_FragData[2]
    //     ]);
    //
    //     const renderBuffer = gl.createRenderbuffer();
    //     gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    //     gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.texWidth, this.texHeight);
    //     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
    //
    //     if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    //         throw "error: framebuffer incomplete";
    //     }
    //
    //     gl.bindTexture(gl.TEXTURE_2D, null);
    //     gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // }
    //
    // drawGBuffer(env, geometry) {
    //     const models = env.getModels();
    //     const gl = this.gl;
    //     const program = this.gBufferProgram;
    //
    //     gl.useProgram(program);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, this.gBufferFrameBuffer);
    //     gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //
    //     geometry.updateMVPMatrix(gl.viewportWidth / gl.viewportHeight);
    //
    //     const mvMatrix = geometry.getMVMatrix();
    //
    //     models.forEach(model => {
    //         const mvMatrixCopy = copyMatrix4(mvMatrix);
    //         model.updateMVMatrix(mvMatrixCopy);
    //
    //         gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    //         if (program.aVertexPosition !== -1) {
    //             gl.enableVertexAttribArray(program.aVertexPosition);
    //             gl.vertexAttribPointer(program.aVertexPosition, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //         }
    //
    //         gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    //         if (program.aVertexColor !== -1) {
    //             gl.enableVertexAttribArray(program.aVertexColor);
    //             gl.vertexAttribPointer(program.aVertexColor, model.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //         }
    //
    //         gl.bindBuffer(gl.ARRAY_BUFFER, model.normalsBuffer);
    //         if (program.aVertexNormal !== -1) {
    //             gl.enableVertexAttribArray(program.aVertexNormal);
    //             gl.vertexAttribPointer(program.aVertexNormal, model.normalsBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //         }
    //
    //         gl.uniformMatrix4fv(program.uPMatrix, false, geometry.getPMatrix());
    //         gl.uniformMatrix4fv(program.uMVMatrix, false, mvMatrixCopy);
    //         gl.uniformMatrix3fv(program.uNMatrix, false, toNormalMVMatrix(mvMatrixCopy));
    //
    //         gl.drawArrays(gl.TRIANGLES, 0, model.vertexBuffer.numItems);
    //     });
    //
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // }
    //
    // drawCompose(env, geometry, renderLayer) {
    //     const gl = this.gl;
    //     const program = this.composeProgram;
    //
    //     gl.useProgram(program);
    //     gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //
    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.quadModel.buffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, this.quadModel.data, gl.STATIC_DRAW);
    //     gl.enableVertexAttribArray(program.aVertexPosition);
    //     gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    //
    //     gl.uniform1i(program.uColorSampler, 0); // wtf?
    //     gl.activeTexture(gl.TEXTURE0);
    //     gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    //
    //     gl.uniform1i(program.uPositionSampler, 1); // wtf?
    //     gl.activeTexture(gl.TEXTURE1);
    //     gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
    //
    //     gl.uniform1i(program.uNormalSampler, 2); // wtf?
    //     gl.activeTexture(gl.TEXTURE2);
    //     gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
    //
    //     const lightPosArray = geometry.applyMVMatrix(env.getLightsPosArray());
    //     gl.uniform3fv(program.uLights, flatten(lightPosArray));
    //     gl.uniform1i(program.uLightsSize, env.getLightsNum());
    //
    //     const lightColors = env.getLightsColors();
    //     gl.uniform3fv(program.uLightColors, flatten(lightColors));
    //     gl.uniform1i(program.uColorsSize, env.getLightsNum());
    //
    //     const lightPos = geometry.applyMVMatrix(env.getLightPos());
    //     gl.uniform3fv(program.uLightPos, lightPos);
    //
    //     gl.uniform1i(program.uRenderLayer, renderLayer);
    //
    //     gl.drawArrays(gl.TRIANGLES, 0, 6);
    // }
    // endregion
}