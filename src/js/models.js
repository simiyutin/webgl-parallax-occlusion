function getNormalForFace(face) {
    var p1 = vec3.create([face[0], face[1], face[2]]);
    var p2 = vec3.create([face[3 + 0], face[3 + 1], face[3 + 2]]);
    var p3 = vec3.create([face[6 + 0], face[6 + 1], face[6 + 2]]);

    var a = vec3.create();
    vec3.subtract(p2, p1, a);

    var b = vec3.create();
    vec3.subtract(p3, p1, b);

    var normal = vec3.create();
    vec3.cross(a, b, normal); // у нас левая тройка
    vec3.normalize(normal, normal);

    return normal;
}

function loadPyramid() {

    function getFacesForPyramid() {
        var faces = [
            [
                1, -1, -1,
                -1, -1, -1,
                0, 1, 0
            ],
            [
                1, -1, 1,
                1, -1, -1,
                0, 1, 0
            ],
            [
                -1, -1, 1,
                1, -1, 1,
                0, 1, 0
            ],
            [
                -1, -1, -1,
                -1, -1, 1,
                0, 1, 0
            ]
        ];

        return faces;
    }

    function getVerticesForPyramid() {
        var faces = getFacesForPyramid();
        var vertices = [].concat.apply([], faces);
        return vertices;
    }

    function getNormalsForPyramid() {
        var faces = getFacesForPyramid();
        var normalsPerFace = faces.map(function (f) {return getNormalForFace(f)});
        console.dir(faces);
        var normals = [];
        normalsPerFace.forEach(function (value) {
            var untyped = Array.prototype.slice.call(value);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
        });
        console.dir(normals);
        return normals;
    }

    function getColorsForPyramid() {
        // var colors = [
        //     // Front face
        //     1.0, 0.0, 0.0, 1.0,
        //     0.0, 1.0, 0.0, 1.0,
        //     1.0, 1.0, 0.0, 1.0,
        //     // Right face
        //     1.0, 0.0, 0.0, 1.0,
        //     1.0, 1.0, 0.0, 1.0,
        //     0.0, 1.0, 1.0, 1.0,
        //     // Back face
        //     1.0, 0.0, 0.0, 1.0,
        //     0.0, 1.0, 1.0, 1.0,
        //     0.0, 0.0, 1.0, 1.0,
        //     // Left face
        //     1.0, 0.0, 0.0, 1.0,
        //     0.0, 0.0, 1.0, 1.0,
        //     0.0, 1.0, 0.0, 1.0
        // ];

        var colors = [];
        for (var i = 0; i < 3; i++) {
            colors = colors.concat([1, 0, 0, 1])
        }
        for (var i = 0; i < 12 - 3; i++) {
            colors = colors.concat([1, 1, 1, 1])
        }
        return colors;
    }


    var verticesData = getVerticesForPyramid();
    var normalsData = getNormalsForPyramid();
    var colorsData = getColorsForPyramid();

    var result = {
        vertices: {
            data: verticesData,
            itemSize: 3,
            numItems: verticesData.length / 3
        },
        normals: {
            data: normalsData,
            itemSize: 3,
            numItems: normalsData.length / 3
        },
        colors: {
            data: colorsData,
            itemSize: 4,
            numItems: colorsData.length / 4
        },
        minx: -1,
        miny: -1,
        minz: -1,
        maxx: 1,
        maxy: 1,
        maxz: 1
    };

    return result;
}

//todo generalise
function loadPlane() {

    function getFacesForPyramid() {
        var faces = [
            [
                1000, 0, 0,
                -1000, 0, -1000,
                -1000, 0, 1000
            ]
        ];

        return faces;
    }

    function getVerticesForPyramid() {
        var faces = getFacesForPyramid();
        var vertices = [].concat.apply([], faces);
        return vertices;
    }

    function getNormalsForPyramid() {
        var faces = getFacesForPyramid();
        var normalsPerFace = faces.map(function (f) {return getNormalForFace(f)});
        console.dir(faces);
        var normals = [];
        normalsPerFace.forEach(function (value) {
            var untyped = Array.prototype.slice.call(value);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
        });
        console.dir(normals);
        return normals;
    }

    function getColorsForPyramid() {
        var colors = [];
        for (var i = 0; i < 3; i++) {
            colors = colors.concat([1, 1, 1, 1])
        }
        return colors;
    }


    var verticesData = getVerticesForPyramid();
    var normalsData = getNormalsForPyramid();
    var colorsData = getColorsForPyramid();

    var result = {
        vertices: {
            data: verticesData,
            itemSize: 3,
            numItems: verticesData.length / 3
        },
        normals: {
            data: normalsData,
            itemSize: 3,
            numItems: normalsData.length / 3
        },
        colors: {
            data: colorsData,
            itemSize: 4,
            numItems: colorsData.length / 4
        }
    };

    return result;
}

function buildModelFromFaces(faces) {
    function getVertices() {
        var vertices = [].concat.apply([], faces);
        return vertices;
    }

    function getNormals() {
        var normalsPerFace = faces.map(function (f) {return getNormalForFace(f)});
        console.dir(faces);
        var normals = [];
        normalsPerFace.forEach(function (value) {
            var untyped = Array.prototype.slice.call(value);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
            normals = normals.concat(untyped);
        });
        console.dir(normals);
        return normals;
    }

    function getColors() {
        var colors = [];
        for (var i = 0; i < 3; i++) {
            colors = colors.concat([1, 1, 1, 1])
        }
        return colors;
    }


    var verticesData = getVertices();
    var normalsData = getNormals();
    var colorsData = getColors();

    var result = {
        vertices: {
            data: verticesData,
            itemSize: 3,
            numItems: verticesData.length / 3
        },
        normals: {
            data: normalsData,
            itemSize: 3,
            numItems: normalsData.length / 3
        },
        colors: {
            data: colorsData,
            itemSize: 4,
            numItems: colorsData.length / 4
        }
    };

    return result;
}

function loadBunny(color) {
    // return loadMeshFromFileName("/models/bunny_normals_simplified_level2.obj", color);
    return loadCube(color);
}

function loadFile(fileName) {
    var xmlhttp = new XMLHttpRequest();
    var url = `http://localhost:8000/${fileName}`;
    console.log("Loading File <" + fileName + ">...");

    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.readyState === XMLHttpRequest.DONE) {
        if (xmlhttp.status === 200) {
            var data = xmlhttp.responseText;
            return data;
        }
    }

    throw "failed to load file!";
}

function loadCube(color) {
    function computeTangents(model) {
        const vertices = model.vertices.data;
        const texcoords = model.texcoords.data;
        if (vertices.length / 3 !== texcoords.length / 2) {
            throw 'lolwut';
        }

        model.tangents = {
            data: [],
            itemSize: 3,
            numItems: vertices.length / 3
        };

        model.bitangents = {
            data: [],
            itemSize: 3,
            numItems: vertices.length / 3
        };

        // для каждого фейса
        for (let i = 0, j = 0; i < vertices.length; i += 3 * 3, j += 2 * 3) {
            const pxa = vertices[i + 0];
            const pya = vertices[i + 1];
            const pza = vertices[i + 2];
            const pxb = vertices[i + 3];
            const pyb = vertices[i + 4];
            const pzb = vertices[i + 5];
            const pxc = vertices[i + 6];
            const pyc = vertices[i + 7];
            const pzc = vertices[i + 8];

            const pa = vec3.create([pxa, pya, pza]);
            const pb = vec3.create([pxb, pyb, pzb]);
            const pc = vec3.create([pxc, pyc, pzc]);

            const q1 = vec3.create();
            vec3.subtract(pb, pa, q1);

            const q2 = vec3.create();
            vec3.subtract(pc, pa, q2);

            const tua = texcoords[j + 0];
            const tva = texcoords[j + 1];
            const tub = texcoords[j + 2];
            const tvb = texcoords[j + 3];
            const tuc = texcoords[j + 4];
            const tvc = texcoords[j + 5];

            const ta = vec3.create([tua, tva, 0]);
            const tb = vec3.create([tub, tvb, 0]);
            const tc = vec3.create([tuc, tvc, 0]);

            const w1 = vec3.create();
            vec3.subtract(tb, ta, w1);

            const w2 = vec3.create();
            vec3.subtract(tc, ta, w2);

            const s1 = w1[0];
            const t1 = w1[1];
            const s2 = w2[0];
            const t2 = w2[1];

            const denominator = s1 * t2 - s2 * t1;

            const scale = vec3.create([1/denominator, 1/denominator, 1/denominator]);

            const inv = mat4.create([
                t2 ,-t1,  0, 0,
                -s2,  s1 , 0, 0,
                0  , 0  , 0, 0,
                0, 0, 0, 0
            ]);

            const pos = mat4.create([
                q1[0], q1[1], q1[2], 0,
                q2[0], q2[1], q2[2], 0,
                0, 0, 0, 0,
                0, 0, 0, 0
            ]);

            const res = mat4.create();
            mat4.multiply(pos, inv, res);
            mat4.scale(res, scale);

            const T = [res[0], res[1], res[2]];
            const B = [res[4], res[5], res[6]];

            // console.log(`T = ${T}`);
            // console.log(`B = ${B}`);

            for (let k = 0; k < 3; ++k) {
                Array.prototype.push.apply(model.tangents.data, T);
                Array.prototype.push.apply(model.bitangents.data, B);
            }
        }
    }

    const model = loadMeshFromFileName("/models/cube.obj", color);
    computeTangents(model);
    return model;
}


function loadMeshFromFileName(filename, color) {
    var data = loadFile(filename);
    var model = loadMeshFromString(data, color);
    return model;
}


function loadMeshFromString(string, color) {
    var lines = string.split("\n");
    var verticesUnique = [];
    var texcoordsUnique = [];
    var normalsUnique = [];
    var vertices = [];
    var normals = [];
    var texcoords = [];

    var minx = Number.POSITIVE_INFINITY;
    var miny = Number.POSITIVE_INFINITY;
    var minz = Number.POSITIVE_INFINITY;
    var maxx = Number.NEGATIVE_INFINITY;
    var maxy = Number.NEGATIVE_INFINITY;
    var maxz = Number.NEGATIVE_INFINITY;

    for ( var i = 0 ; i < lines.length ; i++ ) {
        var parts = lines[i].trimRight().split(' ');
        if ( parts.length > 0 ) {
            switch(parts[0]) {
                case 'v':
                    var x = parseFloat(parts[1]);
                    var y = parseFloat(parts[2]);
                    var z = parseFloat(parts[3]);
                    verticesUnique.push([x, y, z]);
                    minx = Math.min(minx, x);
                    miny = Math.min(miny, y);
                    minz = Math.min(minz, z);
                    maxx = Math.max(maxx, x);
                    maxy = Math.max(maxy, y);
                    maxz = Math.max(maxz, z);
                    break;
                case 'vn':
                    normalsUnique.push(
                        [
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ]);
                    break;
                case 'vt':
                    texcoordsUnique.push(
                        [
                            parseFloat(parts[1]),
                            parseFloat(parts[2])
                        ]
                    );
                    break;
                case 'f': {
                    var f1 = parts[1].split('/');
                    var f2 = parts[2].split('/');
                    var f3 = parts[3].split('/');
                    ////////////////////
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f1[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        texcoords, texcoordsUnique[parseInt(f1[1]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f1[2]) - 1]
                    );
                    ////////////////////
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f2[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        texcoords, texcoordsUnique[parseInt(f2[1]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f2[2]) - 1]
                    );
                    ////////////////////
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f3[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        texcoords, texcoordsUnique[parseInt(f3[1]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f3[2]) - 1]
                    );
                    /////////////////////
                    break;
                }
            }
        }
    }
    var vertexCount = vertices.length / 3;
    console.log("Loaded mesh with " + vertexCount + " vertices");

    if (normals.length / 3 !== vertexCount) {
        alert('normals not supplied, not able to load model');
        throw 'error: normals not supplied, not able to load model';
        // // TODO поправить, не работает
        // if (normals.length === 0) {
        //     for (var i = 0; i < vertices.length; i += 9) {
        //         var normal = getNormalForFace(vertices.slice(i * 9, (i + 1) * 9));
        //         normals.push.apply(normals, normal);
        //         normals.push.apply(normals, normal);
        //         normals.push.apply(normals, normal);
        //     }
        // } else {
        //     throw "invalid normals count!";
        // }
    }

    var colors = [];
    for (var i = 0; i < vertexCount; i++) {
        var shadeOfGray = 0.5;
        color = color || [shadeOfGray, shadeOfGray, shadeOfGray, 1];
        colors = colors.concat(color);
    }

    var result = {
        vertices: {
            data: vertices,
            itemSize: 3,
            numItems: vertices.length / 3
        },
        texcoords: {
            data: texcoords,
            itemSize: 2,
            numItems: texcoords.length / 2
        },
        normals: {
            data: normals,
            itemSize: 3,
            numItems: normals.length / 3
        },
        colors: {
            data: colors,
            itemSize: 4,
            numItems: colors.length / 4
        },
        minx: minx,
        miny: miny,
        minz: minz,
        maxx: maxx,
        maxy: maxy,
        maxz: maxz
    };

    return result;
}