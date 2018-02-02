attribute vec2 aVertexTexcoord;
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexTangent;
attribute vec3 aVertexBiTangent;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightDir;

varying vec2 vTexcoord;
varying vec3 vPosition;

varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vEye;

void main(void) {
    vTexcoord = aVertexTexcoord;

    vec4 worldPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * worldPosition;
    vPosition = worldPosition.xyz / worldPosition.w;
    vec3 normalWorld = uNMatrix * aVertexNormal;

    vec3 tangentWorld = uNMatrix * aVertexTangent;
    vec3 bitangentWorld = uNMatrix * aVertexBiTangent;

    mat3 w;
    w[0][0] = tangentWorld[0]; w[0][1] = bitangentWorld[0]; w[0][2] = normalWorld[0];
    w[1][0] = tangentWorld[1]; w[1][1] = bitangentWorld[1]; w[1][2] = normalWorld[1];
    w[2][0] = tangentWorld[2]; w[2][1] = bitangentWorld[2]; w[2][2] = normalWorld[2];
    mat3 worldToTangentSpace = w;

    vNormal = worldToTangentSpace * normalWorld;
    vLightDir = worldToTangentSpace * uLightDir;
    vEye = worldToTangentSpace * vPosition;
}
