import * as THREE from 'three';

let doorOpen = false;
let clock = new THREE.Clock();

let composer, controls;
let FrontleftDoor, FrontrightDoor, backLeftDoor, backRightDoor;
let spoiler, wheelFL, wheelFR, upperWindow, handle;
let paintedParts = [];


let camera;
let rearView = window.rearView; // 👈 ربط بالحالة العالمية









// 📍 إعداد الكاميرا حسب نوع الجهاز + حفظ المواضع الديناميكية
export function setupInitialCameraPosition(camera) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  console.log('📱 isMobile?', isMobile); // ← للمراجعة

  if (isMobile) {
    // 📱 إعدادات الكاميرا للموبايل
    camera.position.set(-120, 20, -500);
    window.rearCamPosition = new THREE.Vector3(45, 12, 120);
  } else {
    // 🖥️ إعدادات الكاميرا للديسكتوب
    camera.position.set(-50, 14.13, -400);
    window.rearCamPosition = new THREE.Vector3(65, 14, 250);
  }

  window.frontCamPosition = camera.position.clone();
  window.frontTarget = new THREE.Vector3(0, 2, 0);
  window.rearTarget = new THREE.Vector3(0, 2, 0);

  camera.rotation.set(-3.05, -0.31, -3.11);
  camera.updateProjectionMatrix();
}









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

// 📏 منع الكاميرا من النزول تحت الأرض
if (camera.position.y < 1) {
  camera.position.y = 1;
}
}



//shake Camera
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



if (window.rearView) {
  console.warn("Cannot open doors in rear view mode.");
  return; // ⛔️ إلغاء الوظيفة
}



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

  if (t < 1) {
    requestAnimationFrame(animateCamera);
  } else {
    // ✅ بعد انتهاء الحركة، شغّل الاهتزاز مع الصوت
    if (!doorOpen && window.engineSound) {
      window.engineSound.stop();
      setTimeout(() => {
        window.engineSound.play();
        shakeCamera(0.3, 400); // اهتزاز واضح
      }, 350);
    }
  }
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



// ✅ تشغيل أو إطفاء الضوء حسب حالة الأبواب
if (doorOpen) {
  // ✅ تأخير تشغيل المصابيح بعد 500ms من فتح الأبواب
  setTimeout(() => {
    if (window.spotlightLeft) window.spotlightLeft.visible = true;
    if (window.spotlightRight) window.spotlightRight.visible = true;
  }, 380);
} else {
  // ✅ إطفاء المصابيح فورًا عند الإغلاق
  if (window.spotlightLeft) window.spotlightLeft.visible = false;
  if (window.spotlightRight) window.spotlightRight.visible = false;
}



    }
  }

if (!doorOpen && window.engineSound) {
  window.engineSound.stop();

  setTimeout(() => {
    window.engineSound.play();
    shakeCamera(2, 1000); // ⬅️ اهتزاز قوي، لمدة 300ms
  }, 800); // تأخير قبل التشغيل
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




//camera pos2
window.switchCameraView = function () {
  if (doorOpen) toggleDoors();

  const doorBtn = document.getElementById('door-btn');
  doorBtn.disabled = true;

  const camFrom = camera.position.clone();
const camTo = rearView ? window.frontCamPosition.clone() : window.rearCamPosition.clone();


  const targetFrom = controls.target.clone();
 const targetTo = rearView ? window.frontTarget.clone() : window.rearTarget.clone();


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
      rearView = !rearView;
      window.rearView = rearView;
      doorBtn.disabled = rearView;
    }
  }

  animateSwitch();
};
