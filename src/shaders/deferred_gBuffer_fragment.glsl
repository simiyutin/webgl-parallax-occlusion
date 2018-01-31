#extension GL_EXT_draw_buffers : require
precision highp float;
//uniform vec4 uSpecularColor; // todo в самую последнюю очередь

varying vec4 vColor;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // color
  gl_FragData[0] = vColor;
  // position
  gl_FragData[1] = vec4(vPosition, 1.0);
  // normal
  gl_FragData[2] = vec4(vNormal, 1.0);
}
