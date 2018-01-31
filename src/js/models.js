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

function loadBunny(color) {
    return loadMeshFromFileName("/models/bunny_normals_simplified_level2.obj", color);
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


function loadMeshFromFileName(filename, color) {
    var data = loadFile(filename);
    var model = loadMeshFromString(data, color);
    return model;
}


function loadMeshFromString(string, color) {
    var lines = string.split("\n");
    var verticesUnique = [];
    var normalsUnique = [];
    var vertices = [];
    var normals = [];

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
                case 'f': {
                    var f1 = parts[1].split('/');
                    var f2 = parts[2].split('/');
                    var f3 = parts[3].split('/');
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f1[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f1[2]) - 1]
                    );
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f2[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f2[2]) - 1]
                    );
                    Array.prototype.push.apply(
                        vertices, verticesUnique[parseInt(f3[0]) - 1]
                    );
                    Array.prototype.push.apply(
                        normals, normalsUnique[parseInt(f3[2]) - 1]
                    );
                    break;
                }
            }
        }
    }
    var vertexCount = vertices.length / 3;
    console.log("Loaded mesh with " + vertexCount + " vertices");

    if (normals.length / 3 !== vertexCount) {
        // TODO поправить, не работает
        if (normals.length === 0) {
            for (var i = 0; i < vertices.length; i += 9) {
                var normal = getNormalForFace(vertices.slice(i * 9, (i + 1) * 9));
                normals.push.apply(normals, normal);
                normals.push.apply(normals, normal);
                normals.push.apply(normals, normal);
            }
        } else {
            throw "invalid normals count!";
        }
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