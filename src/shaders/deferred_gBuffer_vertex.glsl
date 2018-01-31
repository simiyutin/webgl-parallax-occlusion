attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;
attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main(void) {
    vColor = aVertexColor;
    vNormal = uNMatrix * aVertexNormal;

    vec4 transformedPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    vPosition = transformedPosition.xyz / transformedPosition.w;

    gl_Position = uPMatrix * transformedPosition;
}
