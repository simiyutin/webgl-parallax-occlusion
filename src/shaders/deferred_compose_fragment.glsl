precision mediump float;
uniform sampler2D uColorSampler;
uniform sampler2D uPositionSampler;
uniform sampler2D uNormalSampler;
uniform vec3 uLightPos;

const int MAX_LIGHTS_SIZE = 256;
uniform vec3 uLights[MAX_LIGHTS_SIZE];
uniform int uLightsSize;

const int MAX_COLORS_SIZE = MAX_LIGHTS_SIZE;
uniform vec3 uLightColors[MAX_COLORS_SIZE];
uniform int uColorsSize;

uniform int uRenderLayer;

varying vec4 vScreenPosition;

vec4 uAmbientColor = vec4(0.2, 0.2, 0.2, 1);
vec3 uSpecularColor = vec3(0.0, 0.0, 0.0);
const float MAX_DIST = 10.0;
const vec3 BLACK_RGB = vec3(0.0, 0.0, 0.0);
const vec4 BLACK_RGBA = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 RED_RGBA = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 GREEN_RGBA = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 BLUE_RGBA = vec4(0.0, 0.0, 1.0, 1.0);

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

vec3 getLightAmbient(vec4 color) {
    return color.rgb * uAmbientColor.rgb;
}

vec3 vec2col(vec3 v) {
    return v * 0.5 + 0.5;
}

void main() {
    vec3 xyz = vScreenPosition.xyz / vScreenPosition.w * 0.5 + 0.5;

    vec4 color = texture2D(uColorSampler, xyz.xy);
    if (uRenderLayer == 1) {
        gl_FragColor = color;
        return;
    }

    vec3 position = texture2D(uPositionSampler, xyz.xy).xyz;
    if (uRenderLayer == 2) {
        gl_FragColor = vec4(vec2col(position / 20.0), 1.0);
        return;
    }

    vec3 normal = normalize(texture2D(uNormalSampler, xyz.xy).xyz);
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
