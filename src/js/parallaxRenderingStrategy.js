class ParallaxRenderingStrategy {
    constructor(gl) {
        this.gl = gl;
        if (!gl.getExtension('OES_standard_derivatives') || !gl.getExtension('EXT_shader_texture_lod')) {
            throw "error: extension cannot be loaded";
        }
        this.mainProgram = null;
        this.initProgram('main');
        this.colorTexture = this.loadTexture('color.jpg');
        this.depthTexture = this.loadTexture('depth.jpg');
        this.coneTexture = this.loadTexture('step.png');
    }

    // region interface
    renderFrame(env, geometry, parallaxMode) {
        this.drawScene(env, geometry, parallaxMode);
    }
    // endregion

    // region private

    drawScene(env, geometry, parallaxMode) {
        const models = env.getModels();
        const gl = this.gl;
        const mainProgram = this.mainProgram;
        const colorTexture = this.colorTexture;
        const depthTexture = this.depthTexture;
        const coneTexture = this.coneTexture;

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
            gl.bindTexture(gl.TEXTURE_2D, coneTexture);
            gl.uniform1i(mainProgram.uConeSampler, 2);

            gl.uniform1i(mainProgram.uParallaxMode, parallaxMode);


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
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        };
        image.src = `http://localhost:8000/textures/${name}`;

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
        program.uConeSampler = gl.getUniformLocation(program, "uConeSampler");
        program.uParallaxMode = gl.getUniformLocation(program, "uParallaxMode");
    }
}