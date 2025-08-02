
//materials.js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';


// 🪞 كروم
const chromeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.0,
  reflectivity: 1.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.0,
  envMapIntensity: 1.5,
});

// ✳️ نحتاج لاحقًا لتحديث الـ envMap بعد تحميل HDR
export function setEnvMapToChrome(envMap) {
  chromeMaterial.envMap = envMap;
}

export { chromeMaterial };


// 🎨 الطلاء المتغير
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

export function applyPaintMaterial(partsArray) {
  partsArray.forEach(part => {
    if (part) {
      part.material = paintMaterial;
      paintedParts.push(part);
    }
  });
}


// 💡 إضاءة المصابيح
export const headlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 5.0,
  metalness: 0.2,
  roughness: 0.1
});


// 🌅 تحميل HDRI وتطبيقه على المشهد والمواد
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
        if (part?.material) part.material.envMap = envMap;
      });

      texture.dispose();
      pmrem.dispose();
    });
}



// 🧱 خامة الأرضية

const textureLoader = new THREE.TextureLoader();

// الخامة الرئيسية
const floorTexture = textureLoader.load('img/Concrete022_1K-JPG_Color.jpg');

// خريطة الارتفاع (bump)
const floorBump = textureLoader.load('img/Concrete022_1K-JPG_Displacement.jpg');

// التكرار
[floorTexture, floorBump].forEach(tex => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(50, 50);
});

// إنشاء الخامة
export const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  bumpMap: floorBump,
  bumpScale: 2, // 👈 تحكم بوضوح النتوء (0.05–0.2)
  roughness: 1,
  metalness: 0
});
