#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_shader_texture_lod : enable

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
varying vec3 vEye;

const vec3 BLACK_RGB = vec3(0.0, 0.0, 0.0);
const vec4 BLACK_RGBA = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 RED_RGBA = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 GREEN_RGBA = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 BLUE_RGBA = vec4(0.0, 0.0, 1.0, 1.0);

vec3 getLightDirectional(vec3 normal, vec3 color) {
    vec3 lightDir = normalize(vLightDir);
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

float lerp(float a, float b, float coef) {
    return a * (1.0 - coef) + b * coef;
}

float transformDepth(float depth) {
    return depth;
}

vec3 mapNormal(vec2 texcoord) {

    const vec2 size = vec2(1.0,0.0) / 8.0;
    const vec3 off = vec3(-1.0, 0.0, 1.0) / 512.0;

    float s01 = transformDepth(texture2D(uDepthSampler, texcoord + off.xy).x);
    float s21 = transformDepth(texture2D(uDepthSampler, texcoord + off.zy).x);
    float s10 = transformDepth(texture2D(uDepthSampler, texcoord + off.yx).x);
    float s12 = transformDepth(texture2D(uDepthSampler, texcoord + off.yz).x);
    vec3 va = normalize(vec3(size.xy,s21-s01));
    vec3 vb = normalize(vec3(size.yx,s12-s10));
    vec3 normal = cross(va,vb);
    return normal;
}

vec2 getCorrectedTexcoords() {
    vec2 texcoord = vTexcoord;
    vec3 eye = normalize(vEye);
    vec3 normal = normalize(vNormal);

    const float heightScale = 0.1;
    const float maxSamples = 100.0;
    const float minSamples = 50.0;

    float parallaxLimit = -length(eye.xy) / eye.z;
    parallaxLimit *= heightScale;

    vec2 offsetDir = normalize(eye.xy);
    vec2 maxOffset = offsetDir * parallaxLimit;

    int numSamples = int(lerp(maxSamples, minSamples, dot(eye, normal)));
    float step = 1.0 / float(numSamples);

    float currRayHeight = 1.0;
    vec2 currOffset = vec2(0.0, 0.0);
    vec2 prevOffset = vec2(0.0, 0.0);
    float lastSampledHeight = 1.0;
    float currSampledHeight = 1.0;

    vec2 dx = dFdx(texcoord);
    vec2 dy = dFdy(texcoord);

    for (int i = 0; i < int(maxSamples); ++i) {
        if (i >= numSamples) {
            break;
        }

        currSampledHeight = transformDepth(texture2DGradEXT(uDepthSampler, texcoord + currOffset, dx, dy).r);
        if (currSampledHeight > currRayHeight) {
            // find point of intersection
            float delta1 = currSampledHeight - currRayHeight;
            float delta2 = (currRayHeight + step) - lastSampledHeight;
            float ratio = delta1 / (delta1 + delta2);
            currOffset = ratio * prevOffset + (1.0 - ratio) * currOffset;
            break;
        } else {
            currRayHeight -= step;
            lastSampledHeight = currSampledHeight;
            prevOffset = currOffset;
            currOffset += step * maxOffset;
        }
    }

    return texcoord + currOffset;
}

vec2 getCorrectedTexcoordsConeMap() {
    vec2 texcoord = vTexcoord;
    vec3 eye = normalize(vEye);
    vec3 normal = normalize(vNormal);

    const float heightScale = 0.1;
    const float maxSamples = 100.0;
    const float minSamples = 50.0;

    float parallaxLimit = -length(eye.xy) / eye.z;
    parallaxLimit *= heightScale;

    vec2 offsetDir = normalize(eye.xy);
    vec2 maxOffset = offsetDir * parallaxLimit;

    int numSamples = int(lerp(maxSamples, minSamples, dot(eye, normal)));
    float step = 1.0 / float(numSamples);

    float currRayHeight = 1.0;
    vec2 currOffset = vec2(0.0, 0.0);
    vec2 prevOffset = vec2(0.0, 0.0);
    float lastSampledHeight = 1.0;
    float currSampledHeight = 1.0;

    vec2 dx = dFdx(texcoord);
    vec2 dy = dFdy(texcoord);

    float z = abs(eye.z);
    float iz = sqrt(1.0 - z * z);

    for (int i = 0; i < int(maxSamples); ++i) {
        if (i >= numSamples) {
            break;
        }

        currSampledHeight = transformDepth(texture2DGradEXT(uDepthSampler, texcoord + currOffset, dx, dy).r);
//        stepRatio = 0;

        if (currSampledHeight > currRayHeight) {
            // find point of intersection
            float delta1 = currSampledHeight - currRayHeight;
            float delta2 = (currRayHeight + step) - lastSampledHeight;
            float ratio = delta1 / (delta1 + delta2);
            currOffset = ratio * prevOffset + (1.0 - ratio) * currOffset;
            break;
        } else {
            float coneRatio = texture2DGradEXT(uNormalSampler, texcoord + currOffset, dx, dy).g;
            coneRatio *= coneRatio; // stored is sqrt
            float stepRatio = 1.0 / (iz / coneRatio - z);
            step = stepRatio * z;

            currRayHeight -= step;
            lastSampledHeight = currSampledHeight;
            prevOffset = currOffset;
            currOffset += stepRatio * iz;
        }
    }

    return texcoord + currOffset;
}

void main() {
    vec2 correctedTexcoords = getCorrectedTexcoords();
//    vec2 correctedTexcoords = getCorrectedTexcoordsConeMap();
    vec4 color = texture2D(uColorSampler, correctedTexcoords);
    vec3 normal = mapNormal(correctedTexcoords);
//    vec3 normal = normalize(col2vec(texture2D(uNormalSampler, correctedTexcoords).xyz));
    gl_FragColor = vec4(getLightAmbient(color.rgb) + getLightDirectional(normal, color.rgb), 1.0);
}