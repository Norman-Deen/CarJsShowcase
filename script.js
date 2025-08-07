import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { setupInitialCameraPosition } from './animation.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './three/examples/jsm/loaders/DRACOLoader.js';


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

const textureLoader = new THREE.TextureLoader();
const textureFlare0 = textureLoader.load('img/lensflare0.png');
const textureFlare3 = textureLoader.load('img/lensflare3.png');

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 5, 300);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  setupEnvironment(renderer, scene);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.minDistance = 40;
  controls.maxDistance = 200;
  controls.update();

  function createHeadlightWithFlare(position, target = camera) {
    const spotlight = new THREE.SpotLight(0xffffff, 9000);
    spotlight.position.copy(position);
    spotlight.angle = Math.PI / 20;
    spotlight.penumbra = 0.4;
    spotlight.decay = 1.5;
    spotlight.distance = 100;
    spotlight.castShadow = true;
    spotlight.target = target;

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 300, 0, spotlight.color));
    lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
    lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
    spotlight.add(lensflare);

    scene.add(spotlight);
    scene.add(spotlight.target);

    return spotlight;
  }

  window.spotlightLeft = createHeadlightWithFlare(new THREE.Vector3(-7, 7, -20));
  window.spotlightRight = createHeadlightWithFlare(new THREE.Vector3(7, 7, -20));

  const transformControl = new TransformControls(camera, renderer.domElement);
  spotlightLeft.visible = false;
  spotlightRight.visible = false;

  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(10, 25, 15);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 128;
  sunLight.shadow.mapSize.height = 128;
  sunLight.shadow.camera.left = -30;
  sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30;
  sunLight.shadow.camera.bottom = -30;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 100;
  sunLight.shadow.radius = 5;
  scene.add(sunLight);

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(dracoLoader);

  loader.load('Car-draco.glb', (gltf) => {
    const car = gltf.scene;
    car.scale.set(1, 1, 1);
    scene.add(car);

    setupInitialCameraPosition(camera, controls);

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
      handleFL: gltf.scene.getObjectByName("polymsh_detached12"),
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
      parts.handleFL,
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
      cam: camera
    });

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

    const engineSound = new THREE.Audio(listener);
    audioLoader.load('sounds/car-engine-372477.mp3', function (buffer) {
      engineSound.setBuffer(buffer);
      engineSound.setLoop(false);
      engineSound.setVolume(1.0);
      window.engineSound = engineSound;
    });

    const loaderDiv = document.getElementById('loader');
    if (loaderDiv) loaderDiv.style.display = 'none';

      animateScene();
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    floorMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  window.camera = camera;
  window.rearView = false;


}
