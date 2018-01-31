attribute vec3 aVertexPosition;

varying vec4 vScreenPosition;

void main() {
    gl_Position = vec4(aVertexPosition, 1.0);
    vScreenPosition = gl_Position;
}
