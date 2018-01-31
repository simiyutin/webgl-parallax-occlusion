precision mediump float;

uniform vec3 uLightPos;

const int MAX_LIGHTS_SIZE = 256;
uniform vec3 uLights[MAX_LIGHTS_SIZE];
uniform int uLightsSize;

const int MAX_COLORS_SIZE = MAX_LIGHTS_SIZE;
uniform vec3 uLightColors[MAX_COLORS_SIZE];
uniform int uColorsSize;

uniform vec3 uLightDir;
uniform vec3 uAmbientColor;
uniform vec3 uSpecularColor;
uniform sampler2D uSampler;

uniform int uRenderLayer;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vDepthPosition;

const float MAX_DIST = 10.0;
const vec3 BLACK_RGB = vec3(0.0, 0.0, 0.0);
const vec4 BLACK_RGBA = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 RED_RGBA = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 GREEN_RGBA = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 BLUE_RGBA = vec4(0.0, 0.0, 1.0, 1.0);

vec3 getLight(vec3 lightDir) {
    vec3 normal = normalize(vNormal);
    float lambertian = max(dot(lightDir, normal), 0.0);
    float specular = 0.0;

    if (lambertian > 0.0) {
        vec3 viewDir = normalize(-vPosition);
        vec3 halfDir = normalize(viewDir + lightDir);
        float specCosine = max(dot(halfDir, normal), 0.0);
        specular = pow(specCosine, 16.0);
    }

    return vColor.rgb * lambertian + uSpecularColor * specular;
}

vec3 getLightPoint() {
    vec3 lightDir = normalize(uLightPos - vPosition);
    return getLight(lightDir);
}

vec3 getLightDirectional() {
    return getLight(uLightDir);
}

float inShadow(vec2 xy, float currentDepth){
    float minDepth = texture2D(uSampler, xy).r;
    return minDepth < currentDepth ? 1. : 0.;
}

float inShadowBilinearFiltering(vec2 xy, float currentDepth, float size){
    vec2 texelSize = vec2(1.0)/size;
    vec2 fractionalPart = fract(xy * size + 0.5);
    vec2 roundedPixel = floor(xy * size + 0.5);
    vec2 centerOfPixelXY = roundedPixel / size;

    float lb = inShadow(centerOfPixelXY + texelSize * vec2(0.0, 0.0), currentDepth);
    float lt = inShadow(centerOfPixelXY + texelSize * vec2(0.0, 1.0), currentDepth);
    float rb = inShadow(centerOfPixelXY + texelSize * vec2(1.0, 0.0), currentDepth);
    float rt = inShadow(centerOfPixelXY + texelSize * vec2(1.0, 1.0), currentDepth);

    float l = mix(lb, lt, fractionalPart.y);
    float r = mix(rb, rt, fractionalPart.y);
    float result = mix(l, r, fractionalPart.x);
    return result;
}

float PCF(vec2 xy, float currentDepth){
    float result = 0.0;
    float size = 1000.0;
    for(int x=-2; x<=2; x++){
        for(int y=-2; y<=2; y++){
            vec2 off = vec2(x,y) / size;
            result += inShadowBilinearFiltering(xy + off, currentDepth, size);
        }
    }
    return result / 25.0;
}

float illuminated(vec3 pos, vec3 lightDir, vec3 normal) { // в спроецированной системе карты глубины
    float currentDepth = pos.z;
    float closestDepth = texture2D(uSampler, vec2(pos.x, pos.y)).z;

    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    float shadowFactor = 1. - PCF(pos.xy, currentDepth - bias) * 0.5;
    return shadowFactor;
}

void main_complex_single_point_single_dir() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vPosition);
    float lambertian = max(dot(lightDir, normal), 0.0);
    float specular = 0.0;

    if (lambertian > 0.0) {
        vec3 viewDir = normalize(-vPosition);
        vec3 halfDir = normalize(viewDir + lightDir);
        float specCosine = max(dot(halfDir, normal), 0.0);
        specular = pow(specCosine, 16.0);
    }

    vec3 xyz = vDepthPosition.xyz / vDepthPosition.w * 0.5 + 0.5;
    float illuminatedFactor;
    if (xyz.x > 1. || xyz.x < 0. || xyz.y > 1. || xyz.y < 0.) {
        illuminatedFactor = 1.;
    } else {
        illuminatedFactor = illuminated(xyz, uLightDir, normal);

    }
    gl_FragColor = vec4(uAmbientColor + illuminatedFactor * getLightDirectional() + getLightPoint(), 1.0);
}

vec3 getLightAmbient(vec4 color) {
    return color.rgb * uAmbientColor.rgb;
}

float squareDist(vec3 p1, vec3 p2) {
   vec3 diff = p1 - p2;
   return diff.x * diff.x + diff.y * diff.y + diff.z * diff.z;
}

vec3 getLightPoint(vec3 lightPos, vec3 normal, vec3 position, vec4 color) {
    vec3 lightDir = normalize(lightPos - position);
    float lambertian = max(dot(lightDir, normal), 0.0);
    float specular = 0.0;

    if (lambertian > 0.0) {
        vec3 viewDir = normalize(-position);
        vec3 halfDir = normalize(viewDir + lightDir);
        float specCosine = max(dot(halfDir, normal), 0.0);
        specular = pow(specCosine, 16.0);
    }

    float dist = squareDist(lightPos, position);
    if (dist >= MAX_DIST * MAX_DIST) {
        return BLACK_RGB;
    }
    return (color.rgb * lambertian + uSpecularColor * specular) / dist;
}

vec3 vec2col(vec3 v) {
    return v * 0.5 + 0.5;
}

void main_simple_many_point_zero_dir() {

    vec4 color = vColor;
    if (uRenderLayer == 1) {
        gl_FragColor = color;
        return;
    }
    vec3 position = vPosition;
    if (uRenderLayer == 2) {
        gl_FragColor = vec4(vec2col(position / 20.0), 1.0);
        return;
    }
    vec3 normal = normalize(vNormal);
    if (uRenderLayer == 3) {
        gl_FragColor = vec4(vec2col(normal), 1.0);
        return;
    }

    vec3 pointLight = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < MAX_LIGHTS_SIZE; ++i) {
        if (i >= uLightsSize) {
            break;
        }
        vec4 lightColor = vec4(uLightColors[i], 1.0);
        pointLight += getLightPoint(uLights[i], normal, position, color * lightColor);
    }
    gl_FragColor = vec4(getLightAmbient(color) + pointLight, 1.0);
}

void main() {
    main_simple_many_point_zero_dir();
}