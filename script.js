import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';



import {
  chromeMaterial,
  paintedParts,
  applyPaintMaterial,
  headlightMaterial,
  setupEnvironment,
  floorMaterial 
} from './materials.js';


import {
  animateScene,
  initAnimationParts
} from './animation.js';

let scene, camera, renderer, controls;
let composer;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.01, 200);
  camera.position.set(-36.19, 14.13, -112.57);
  camera.rotation.set(-3.05, -0.31, -3.11);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  //new
 renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // الأفضل للنعومة







  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));


  
setupEnvironment(renderer, scene);


  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();




  // 🔦 ضوء سبوت يواجه الكاميرا
const spotlight = new THREE.SpotLight(0xffffff, 1000);
spotlight.position.set(-7, 6.7, -20); // مكان أمامي منخفض قليلاً
spotlight.angle = Math.PI / 20;
spotlight.penumbra = 0.4;
spotlight.decay = 1.5;
spotlight.distance = 100;
spotlight.castShadow = true;
spotlight.target = camera; // 👈 يضرب باتجاه الكاميرا



scene.add(spotlight);
scene.add(spotlight.target);
// 🧭 مساعد لرؤية الضوء
const spotHelper = new THREE.SpotLightHelper(spotlight);
scene.add(spotHelper);
const transformControl = new TransformControls(camera, renderer.domElement);






// 🌞 ضوء شمسي إضافي فقط للظل
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 25, 15);
sunLight.castShadow = true;

// دقة ظل عالية
sunLight.shadow.mapSize.width = 128;
sunLight.shadow.mapSize.height = 128;

// ✅ مساحة الكاميرا المُناسبة لحجم السيارة (لتفادي التقطيع)
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 100;

// ✅ ظل ناعم فعلياً
sunLight.shadow.radius = 5;

scene.add(sunLight);


// 🧭 مساعد لرؤية الضوء
const sunHelper = new THREE.DirectionalLightHelper(sunLight, 5);
scene.add(sunHelper);







  const loader = new GLTFLoader();
  loader.load('volvo.glb', (gltf) => {
    scene.add(gltf.scene);


    //new
    gltf.scene.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
    child.material.needsUpdate = true;
  }
});


 const parts = {
  FrontleftDoor: gltf.scene.getObjectByName("M_Left_Front_Door"),
  FrontrightDoor: gltf.scene.getObjectByName("M_Right_Front_Door"),
  backLeftDoor: gltf.scene.getObjectByName("M_Left_Back_Door"),
  backRightDoor: gltf.scene.getObjectByName("M_Right_Back_Door"),
  spoiler: gltf.scene.getObjectByName("M_carpaint_spoiler"),
  wheelFL: gltf.scene.getObjectByName("M_wheel_Front_Left"),
  wheelFR: gltf.scene.getObjectByName("M_wheel_Front_Right"),
  upperWindow: gltf.scene.getObjectByName("M_upp_win"),
  handle: gltf.scene.getObjectByName("M_Handel"),
  mirrorL: gltf.scene.getObjectByName("polymsh_detached11"),
  mirrorR: gltf.scene.getObjectByName("carpaint_mirrors"),
  mirrorBack: gltf.scene.getObjectByName("polymsh_detached21"),
  handleFront: gltf.scene.getObjectByName("carpaint_door_handles_f"),
  handleRear: gltf.scene.getObjectByName("carpaint_door_handles_r")
};

const carBody = gltf.scene.getObjectByName("Body");
const carpaintHood = gltf.scene.getObjectByName("carpaint_hood");
const carpaintTailgate = gltf.scene.getObjectByName("carpaint_tailgate");

applyPaintMaterial([
  carBody,
  parts.FrontleftDoor,
  parts.FrontrightDoor,
  parts.backLeftDoor,
  parts.backRightDoor,
  carpaintHood,
  carpaintTailgate,
  parts.spoiler,
  parts.mirrorL,
  parts.mirrorR,
  parts.mirrorBack,
  parts.handleFront,
  parts.handleRear
]);


    const mirror = gltf.scene.getObjectByName("Chroom");
    if (mirror) mirror.material = chromeMaterial;

    const headlight = gltf.scene.getObjectByName("reflect_headlights");
    if (headlight) headlight.material = headlightMaterial;

    initAnimationParts({
      comp: composer,
      ctrl: controls,
      parts,
      paintTargets: paintedParts,
      cam: camera // 👈 أرسل الكاميرا
    });



    // 🔊 صوت حركة الكاميرا
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const cameraSound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('sounds/whoosh-clothes-cape-243486.mp3', function (buffer) {
      cameraSound.setBuffer(buffer);
      cameraSound.setLoop(false);
      cameraSound.setVolume(0.7);
      window.cameraSound = cameraSound;
    });


    animateScene();
  });


  
 

// 🌍 أرضية بخامة واقعية + تستقبل الظلال
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  floorMaterial // 👈 من materials.js
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);


//new
window.camera = camera;



}
