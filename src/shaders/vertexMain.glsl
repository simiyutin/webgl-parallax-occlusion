attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;
attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform mat4 uLightMVMatrix;
uniform mat4 uLightPMatrix;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vDepthPosition;


void main(void) {
    vColor = aVertexColor;

    vec3 transformedNormal = uNMatrix * aVertexNormal;
    vNormal = transformedNormal;

    vec4 transformedPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    float w = transformedPosition[3];
    if (w == 0.0) {
        vPosition = vec3(1.0 / 0.0, 1.0 / 0.0, 1.0 / 0.0); // explicitly show what we need, but not guaranteed to work
    } else {
        vPosition = transformedPosition.xyz / w;
    }

    vDepthPosition = uLightPMatrix * uLightMVMatrix * vec4(aVertexPosition, 1.0);

    gl_Position = uPMatrix * transformedPosition;
}
