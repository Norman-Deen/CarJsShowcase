import * as THREE from 'three';

let doorOpen = false;
let clock = new THREE.Clock();

let composer, controls;
let FrontleftDoor, FrontrightDoor, backLeftDoor, backRightDoor;
let spoiler, wheelFL, wheelFR, upperWindow, handle;
let paintedParts = [];
let camera;


//Setup camera position and target based on device type
export function setupInitialCameraPosition(cameraInstance, ctrl) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  camera = cameraInstance;
  controls = ctrl;

  if (isMobile) {
    camera.position.set(-120, 20, -500);
    window.rearCamPosition = new THREE.Vector3(45, 12, 200);
    controls.target.set(0, 2, 0);
    window.rearTarget = controls.target.clone();
  } else {
    camera.position.set(-33.41, 13.46, -107.95);
    window.rearCamPosition = new THREE.Vector3(29.49, 10.45, 98.363);
    controls.target.set(0, 6, 0);
    window.rearTarget = new THREE.Vector3(-2, 6, 0);
  }

  window.frontCamPosition = camera.position.clone();
  window.frontTarget = controls.target.clone();

  camera.rotation.set(-3.05, -0.31, -3.11);
  camera.updateProjectionMatrix();
  controls.update();
}


 //Receives parts, camera, and control references from main script
export function initAnimationParts({ comp, ctrl, parts, paintTargets, cam }) {
  composer = comp;
  controls = ctrl;
  camera = cam;

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

/**
 * Continuous render loop + door logic
 */
export function animateScene() {
  requestAnimationFrame(animateScene);

  if (controls) controls.update();

  // Automatically close doors when camera rotates to rear
  if (doorOpen && camera.position.z > 0 && !window.__forceClose) {
    window.__forceClose = true;
    toggleDoors();
  }

  if (composer) composer.render();

  // Prevent camera from going underground
  if (camera.position.y < 1) {
    camera.position.y = 1;
  }
}

/**
 * Screen shake effect
 */
function shakeCamera(strength = 10, duration = 2000) {
  const startTime = performance.now();
  const initialPosition = camera.position.clone();

  function animateShake(now) {
    const elapsed = now - startTime;
    const progress = elapsed / duration;

    if (progress < 1) {
      const factor = strength * (1 - progress);
      camera.position.x = initialPosition.x + (Math.random() - 0.5) * factor;
      camera.position.y = initialPosition.y + (Math.random() - 0.5) * factor;
      camera.position.z = initialPosition.z + (Math.random() - 0.5) * factor;

      requestAnimationFrame(animateShake);
    } else {
      camera.position.copy(initialPosition);
    }
  }

  requestAnimationFrame(animateShake);
}

/**
 * Toggle door animation and camera transition
 */
window.toggleDoors = function () {
  if (window.rearView) {
    console.warn("Cannot open doors in rear view mode.");
    return;
  }

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
  const handleTargetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), doorOpen ? 0 : degToRad(-100));

  // Animate camera target position smoothly
  const targetFrom = controls.target.clone();
  const targetTo = window.frontTarget.clone();
  const targetStart = clock.getElapsedTime();
  const targetDuration = 0.5;

  function animateTarget() {
    const t = Math.min((clock.getElapsedTime() - targetStart) / targetDuration, 1);
    controls.target.lerpVectors(targetFrom, targetTo, t);
    controls.update();
    if (t < 1) requestAnimationFrame(animateTarget);
  }
  animateTarget();

  // Skip full animation if force-closing
  if (doorOpen && window.__forceClose) {
    window.__forceClose = false;
    animateAll();
    return;
  }

  // Camera zoom animation
  const camStart = camera.position.clone();
  const isMobile = window.matchMedia('(max-width: 768px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  const camTarget = doorOpen
    ? window.frontCamPosition.clone()
    : isMobile
      ? new THREE.Vector3(-44.81, 17.28, -350)
      : new THREE.Vector3(-30, 17.28, -130);

  const camDuration = 0.5;
  const camMoveStart = clock.getElapsedTime();

  function animateCamera() {
    const t = Math.min((clock.getElapsedTime() - camMoveStart) / camDuration, 1);
    camera.position.lerpVectors(camStart, camTarget, t);
    camera.updateProjectionMatrix();

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      if (!doorOpen && window.engineSound) {
        window.engineSound.stop();
        setTimeout(() => {
          window.engineSound.play();
          shakeCamera(0.3, 400);
        }, 350);
      }
    }
  }

if (window.cameraSound) {
  if (window.cameraSound.isPlaying) {
    window.cameraSound.stop();
  }
  window.cameraSound.play();
}


  if (!window.__forceClose) {
    animateCamera();
  }

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

      // Toggle headlights
      if (window.spotlightLeft) window.spotlightLeft.visible = doorOpen;
      if (window.spotlightRight) window.spotlightRight.visible = doorOpen;
    }
  }

  if (!doorOpen && window.engineSound) {
    window.engineSound.stop();
    setTimeout(() => {
      window.engineSound.play();
      shakeCamera(2, 1000);
    }, 800);
  }

  animateAll();
};

/**
 * Instantly close all doors (reset state)
 */
function closeDoorsNow() {
  FrontleftDoor.rotation.y = 0;
  FrontrightDoor.rotation.y = 0;
  backLeftDoor.rotation.y = 0;
  backRightDoor.rotation.y = 0;
  spoiler.rotation.x = 0;
  upperWindow.rotation.x = 0;
  wheelFL.rotation.y = 0;
  wheelFR.rotation.y = 0;
  handle.quaternion.identity();

  if (window.spotlightLeft) window.spotlightLeft.visible = false;
  if (window.spotlightRight) window.spotlightRight.visible = false;

  doorOpen = false;
}

/**
 * Change car color
 */
window.changeColor = function (hex) {
  paintedParts.forEach(part => {
    if (part && part.material) {
      part.material.color.set(hex);
    }
  });
};

/**
 * Switch between front and rear camera views
 */
window.switchCameraView = function () {
  if (doorOpen) toggleDoors();

  const doorBtn = document.getElementById('door-btn');
  doorBtn.disabled = true;

  const camFrom = camera.position.clone();
  const targetFrom = controls.target.clone();

  const camTo = window.rearView ? window.frontCamPosition.clone() : window.rearCamPosition.clone();
  const targetTo = window.rearView ? window.frontTarget.clone() : window.rearTarget.clone();

  const startTime = clock.getElapsedTime();
  const duration = 0.5;

  if (window.cameraSound) {
    window.cameraSound.stop();
    window.cameraSound.play();
  }

  function animateSwitch() {
    const t = Math.min((clock.getElapsedTime() - startTime) / duration, 1);
    camera.position.lerpVectors(camFrom, camTo, t);
    controls.target.lerpVectors(targetFrom, targetTo, t);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateSwitch);
    } else {
      window.rearView = !window.rearView;
      doorBtn.disabled = window.rearView;
    }
  }

  animateSwitch();
};
