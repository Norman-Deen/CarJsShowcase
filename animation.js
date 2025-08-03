import * as THREE from 'three';

let doorOpen = false;
let clock = new THREE.Clock();

let composer, controls;
let FrontleftDoor, FrontrightDoor, backLeftDoor, backRightDoor;
let spoiler, wheelFL, wheelFR, upperWindow, handle;
let paintedParts = [];


let camera;



// 🔧 ربط العناصر من script.js
export function initAnimationParts({
  comp, ctrl, parts, paintTargets,cam
}) {
  composer = comp;
  controls = ctrl;
   camera = cam; // ✅ استلام الكاميرا هنا

  ({
    FrontleftDoor,
    FrontrightDoor,
    backLeftDoor,
    backRightDoor,
    spoiler,
    wheelFL,
    wheelFR,
    upperWindow,
    handle
  } = parts);

  paintedParts = paintTargets;
}

// 🎬 التحريك المستمر
export function animateScene() {
  requestAnimationFrame(animateScene);
  controls.update();
  composer.render();


  
}



// 🚪 فتح/إغلاق الأبواب
window.toggleDoors = function () {
  const duration = 0.5;
  const start = clock.getElapsedTime();

  const fromFL = FrontleftDoor.rotation.y;
  const fromFR = FrontrightDoor.rotation.y;
  const fromBL = backLeftDoor.rotation.y;
  const fromBR = backRightDoor.rotation.y;
  const fromSpoiler = spoiler.rotation.x;
  const fromWin = upperWindow.rotation.x;
  const fromWheelL = wheelFL.rotation.y;
  const fromWheelR = wheelFR.rotation.y;
  const fromHandleQuat = handle.quaternion.clone();

  const degToRad = deg => deg * (Math.PI / 180);
  const doorTarget = doorOpen ? 0 : degToRad(-70);
  const spoilerTarget = doorOpen ? 0 : degToRad(-120);
  const windowTarget = doorOpen ? 0 : degToRad(-10);
  const wheelTarget = doorOpen ? 0 : degToRad(-40);
  const handleTargetQuat = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    doorOpen ? 0 : degToRad(-100)
  );




// 🎥 camera toggle animation
const camStart = doorOpen
  ? new THREE.Vector3(-44.81, 17.28, -143.38) // ← الوضع الحالي
  : new THREE.Vector3(-33.41, 13.46, -107.95); // ← الوضع الأصلي

const camTarget = doorOpen
  ? new THREE.Vector3(-33.41, 13.46, -107.95)
  : new THREE.Vector3(-44.81, 17.28, -143.38);

const camDuration = 0.5; // ثانية
const camMoveStart = clock.getElapsedTime();

function animateCamera() {
  const t = Math.min((clock.getElapsedTime() - camMoveStart) / camDuration, 1);
  camera.position.lerpVectors(camStart, camTarget, t);
  camera.updateProjectionMatrix();

  if (t < 1) requestAnimationFrame(animateCamera);
}



if (window.cameraSound) {
  window.cameraSound.stop();  // ⛔ أوقفه إذا كان مشغول
  window.cameraSound.play();  // ▶️ شغّله من البداية
}




animateCamera();





//doors
  function animateAll() {
    const t = Math.min((clock.getElapsedTime() - start) / duration, 1);
    FrontleftDoor.rotation.y = THREE.MathUtils.lerp(fromFL, doorTarget, t);
    FrontrightDoor.rotation.y = THREE.MathUtils.lerp(fromFR, -doorTarget, t);
    backLeftDoor.rotation.y = THREE.MathUtils.lerp(fromBL, doorTarget, t);
    backRightDoor.rotation.y = THREE.MathUtils.lerp(fromBR, -doorTarget, t);
    spoiler.rotation.x = THREE.MathUtils.lerp(fromSpoiler, spoilerTarget, t);
    upperWindow.rotation.x = THREE.MathUtils.lerp(fromWin, windowTarget, t);
    wheelFL.rotation.y = THREE.MathUtils.lerp(fromWheelL, wheelTarget, t);
    wheelFR.rotation.y = THREE.MathUtils.lerp(fromWheelR, wheelTarget, t);
    handle.quaternion.slerpQuaternions(fromHandleQuat, handleTargetQuat, t);

    if (t < 1) {
      requestAnimationFrame(animateAll);
    } else {
      doorOpen = !doorOpen;
    }
  }

  animateAll();
};

// 🎨 تغيير اللون
window.changeColor = function (hex) {
  paintedParts.forEach(part => {
    if (part && part.material) {
      part.material.color.set(hex);
    }
  });
};
