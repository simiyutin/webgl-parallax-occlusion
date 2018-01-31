precision mediump float;
varying vec4 vPosition;

void main() {
    vec3 xyz = vPosition.xyz / vPosition.w * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(xyz.z), 1.0);
}
