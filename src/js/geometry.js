class Geometry {
    constructor() {
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.mvLightMatrix = mat4.create();
        this.pLightMatrix = mat4.create();
        this.camTranslationMatrix = mat4.create(
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1.3476160764694214, 8.654886245727539, 23.817583084106445, 1]);
        // mat4.identity(this.camTranslationMatrix);
        this.camRotationMatrix = mat4.create();
        this.far = 100;
        this.camPhi = Math.PI / 2;
        this.camTheta = Math.PI / 2;

        this.rotateCamera(this.camPhi, this.camTheta);
    }

    getMVMatrix() {
        return this.mvMatrix;
    }

    getPMatrix() {
        return this.pMatrix;
    }

    getMVLightMatrix() {
        return this.mvLightMatrix;
    }

    getPLightMatrix() {
        return this.pLightMatrix;
    }

    applyMVMatrix(data) {
        if (Array.isArray(data)) {
            const result = [];
            data.forEach(value => {
                const applied = vec3.create();
                mat4.multiplyVec3(this.getMVMatrix(), value, applied);
                result.push(applied);
            });
            return result;
        } else {
            const applied = vec3.create();
            mat4.multiplyVec3(this.getMVMatrix(), data, applied);
            return applied;
        }
    }

    updateMVPMatrix(aspect) {
        mat4.perspective(45, aspect, 0.1, this.far, this.pMatrix);

        const inverseCamMatrix = mat4.create();
        mat4.inverse(this.camTranslationMatrix, inverseCamMatrix);
        mat4.identity(this.mvMatrix);
        mat4.multiply(this.mvMatrix, this.camRotationMatrix);
        mat4.multiply(this.mvMatrix, inverseCamMatrix);
    }

    updateMVPLightMatrix(lightDir) {
        mat4.ortho(-20, 20, -20, 20, -20, 20, this.pLightMatrix);
        mat4.lookAt(lightDir, [0, 0, 0], [0, 1, 0], this.mvLightMatrix);
    }

    rotateCamera(dPhi, dTheta) {
        this.camPhi += deg2rad(dPhi);
        this.camTheta += deg2rad(dTheta);

        const x = Math.cos(this.camPhi) * Math.sin(this.camTheta);
        const z = -Math.sin(this.camPhi) * Math.sin(this.camTheta);
        const y = Math.cos(this.camTheta);
        mat4.lookAt([0, 0, 0], [x, y, z], [0, 1, 0], this.camRotationMatrix);
    }

    translateCamera(delta) {
        const rotatedDelta = vec3.create();
        const inverseRotation = mat4.create();
        mat4.inverse(this.camRotationMatrix, inverseRotation);
        mat4.multiplyVec3(inverseRotation, delta, rotatedDelta);
        mat4.translate(this.camTranslationMatrix, rotatedDelta);
    }
}

function copyMatrix4(matrix) {
    const res = mat4.create();
    mat4.set(matrix, res);
    return res;
}

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

function toNormalMVMatrix(mvMatrixCopy) {
    const normalTransformMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrixCopy, normalTransformMatrix);
    mat3.transpose(normalTransformMatrix);
    return normalTransformMatrix;
}

function dumpGeometry(geometry) {
    const storage = window.localStorage;
    if (!storage) {
        alert('local storage unavailable, cannot save camera state');
    }

    storage.setItem('deferred_shading_geometry_dump', JSON.stringify(geometry));
}

function flushGeometry() {
    const storage = window.localStorage;
    if (storage) {
        storage.removeItem('deferred_shading_geometry_dump');
    }
}

function loadGeometry() {
    const storage = window.localStorage;
    const geometry = new Geometry();
    if (!storage) {
        return geometry;
    }
    let loadedInstance = storage.getItem('deferred_shading_geometry_dump');
    if (!loadedInstance) {
        return geometry;
    }

    loadedInstance = JSON.parse(loadedInstance);

    geometry.mvMatrix = mat4.create(loadedInstance.mvMatrix);
    geometry.pMatrix = mat4.create(loadedInstance.pMatrix);
    geometry.mvLightMatrix = mat4.create(loadedInstance.mvLightMatrix);
    geometry.pLightMatrix = mat4.create(loadedInstance.pLightMatrix);
    geometry.camTranslationMatrix = mat4.create(loadedInstance.camTranslationMatrix);
    geometry.camRotationMatrix = mat4.create(loadedInstance.camRotationMatrix);
    geometry.far = loadedInstance.far;
    geometry.camPhi = loadedInstance.camPhi;
    geometry.camTheta = loadedInstance.camTheta;

    return geometry;

}