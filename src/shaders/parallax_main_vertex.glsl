attribute vec2 aVertexTexcoord;
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec2 vTexcoord;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vTexcoord = aVertexTexcoord;

    vec4 worldPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    vPosition = worldPosition.xyz / worldPosition.w;
    gl_Position = uPMatrix * worldPosition;

    vec3 worldNormal = uNMatrix * aVertexNormal;
    vNormal = worldNormal;
}
