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

float lerp(float a, float b, float coef) {
    return a * (1.0 - coef) + b * coef;
}

vec2 getCorrectedTexcoords() {
    float fHeightMapScale = 0.1;
    float fParallaxLimit = -length(vEye.xy) / vEye.z;
    fParallaxLimit *= fHeightMapScale;

    vec2 vOffsetDir = normalize(vEye.xy);
    vec2 vMaxOffset = vOffsetDir * fParallaxLimit;

    const float nMaxSamples = 100.0;
    const float nMinSamples = 50.0;
    int nNumSamples = int(lerp(nMaxSamples, nMinSamples, dot(vEye, vNormal)));

    float fStepSize = 1.0 / float(nNumSamples);

    vec2 dx = dFdx(vTexcoord);
    vec2 dy = dFdy(vTexcoord);

    float fCurrRayHeight = 1.0;
    vec2 vCurrOffset = vec2(0.0, 0.0);
    vec2 vLastOffset = vec2(0.0, 0.0);
    float fLastSampledHeight = 1.0;
    float fCurrSampledHeight = 1.0;

    for (int nCurrSample = 0; nCurrSample < int(nMaxSamples); ++nCurrSample) {
        if (nCurrSample >= nNumSamples) {
            break;
        }

        fCurrSampledHeight = texture2DGradEXT(uDepthSampler, vTexcoord + vCurrOffset, dx, dy).r;
        if (fCurrSampledHeight > fCurrRayHeight) {

            float delta1 = fCurrSampledHeight - fCurrRayHeight;
            float delta2 = (fCurrRayHeight + fStepSize) - fLastSampledHeight;

            float ratio = delta1 / (delta1 + delta2);

            vCurrOffset = ratio * vLastOffset + (1.0 - ratio) * vCurrOffset;

            break;

        } else {

            fCurrRayHeight -= fStepSize;

            vLastOffset = vCurrOffset;
            vCurrOffset += fStepSize * vMaxOffset;

            fLastSampledHeight = fCurrSampledHeight;
        }
    }

    return vTexcoord + vCurrOffset;
}

void main() {
    vec2 correctedTexcoords = getCorrectedTexcoords();
    vec4 color = texture2D(uColorSampler, correctedTexcoords);
    vec3 normal = normalize(col2vec(texture2D(uNormalSampler, correctedTexcoords).xyz));
    gl_FragColor = vec4(getLightAmbient(color.rgb) + getLightDirectional(normal, color.rgb), 1.0);
}