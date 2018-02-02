precision mediump float;

uniform vec3 uAmbientColor;
uniform vec3 uSpecularColor;
uniform sampler2D uColorSampler;
uniform sampler2D uDepthSampler;
uniform sampler2D uNormalSampler;

varying vec2 vTexcoord;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vLightDir;

const vec3 BLACK_RGB = vec3(0.0, 0.0, 0.0);
const vec4 BLACK_RGBA = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 RED_RGBA = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 GREEN_RGBA = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 BLUE_RGBA = vec4(0.0, 0.0, 1.0, 1.0);

vec3 getLightDirectional(vec3 normal, vec3 color) {
    vec3 lightDir = vLightDir;
    float lambertian = max(dot(lightDir, normal), 0.0);
    float specular = 0.0;

    if (lambertian > 0.0) {
        vec3 viewDir = normalize(-vPosition);
        vec3 halfDir = normalize(viewDir + lightDir);
        float specCosine = max(dot(halfDir, normal), 0.0);
        specular = pow(specCosine, 16.0);
    }

    return color.rgb * lambertian + uSpecularColor * specular;
}

vec3 getLightAmbient(vec3 color) {
    return color * uAmbientColor.rgb;
}

vec3 vec2col(vec3 v) {
    return v * 0.5 + 0.5;
}

vec3 col2vec(vec3 c) {
    return c * 2.0 - 1.0;
}

void main() {
    vec4 color = texture2D(uColorSampler, vTexcoord);
//    vec3 normal = normalize(vNormal);
    vec3 normal = normalize(col2vec(texture2D(uNormalSampler, vTexcoord).xyz));
    gl_FragColor = vec4(getLightAmbient(color.rgb) + getLightDirectional(normal, color.rgb), 1.0);
}