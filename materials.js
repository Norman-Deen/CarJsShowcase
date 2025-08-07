// materials.js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// --------------------
// Chrome Material
// --------------------
const chromeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.0,
  reflectivity: 1.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.0,
  envMapIntensity: 1.5
});

// Will be called after environment HDR is loaded
export function setEnvMapToChrome(envMap) {
  chromeMaterial.envMap = envMap;
}

export { chromeMaterial };

// --------------------
// Custom Paint Material
// --------------------
export const paintedParts = [];

export const paintMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2c2c2c,
  metalness: 0.6,
  roughness: 0.2,
  clearcoat: 0.6,
  clearcoatRoughness: 0.1,
  reflectivity: 0.7,
  envMapIntensity: 2.0
});

// Apply paint material and register the part
export function applyPaintMaterial(partsArray) {
  partsArray.forEach(part => {
    if (part) {
      part.material = paintMaterial;

      // Prevent duplicates in paintedParts
      if (!paintedParts.includes(part)) {
        paintedParts.push(part);
      }
    }
  });
}

// --------------------
// Headlight Material
// --------------------
export const headlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 5.0,
  metalness: 0.2,
  roughness: 0.1
});

// --------------------
// Environment HDR Setup
// --------------------
export function setupEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);

  new RGBELoader()
    .setDataType(THREE.HalfFloatType)
    .load('img/venice_sunset_1k.hdr', (texture) => {
      const envMap = pmrem.fromEquirectangular(texture).texture;

      scene.environment = envMap;
      scene.background = envMap;

      setEnvMapToChrome(envMap);

      paintedParts.forEach(part => {
        if (part?.material) {
          // Dispose old envMap if exists
          if (part.material.envMap) {
            part.material.envMap.dispose();
          }
          part.material.envMap = envMap;
        }
      });

      texture.dispose();
      pmrem.dispose();
    });
}

// --------------------
// Floor Material
// --------------------
const textureLoader = new THREE.TextureLoader();

const floorTexture = textureLoader.load('img/ug4kedun_8K_Albedo.jpg');
const floorNormal = textureLoader.load('img/ug4kedun_8K_Normal.jpg');

// Repeat pattern on large plane
[floorTexture, floorNormal].forEach(tex => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(50, 50);
});

// Brightness multiplier (1 = normal)
const brightness = 0.9;

export const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  normalMap: floorNormal,
  color: new THREE.Color(brightness, brightness, brightness),
  roughness: 1,
  metalness: 0
});
