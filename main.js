// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { EXRLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/EXRLoader.js";

// Create a scene
const scene = new THREE.Scene();

const container = document.getElementById("container3D");

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

// Mouse tracking
let mouseX = container.clientWidth / 2;
let mouseY = container.clientHeight / 2;

let object;
let controls;
let objToRender = "ring";

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);

container.appendChild(renderer.domElement);

renderer.physicallyCorrectLights = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// Initial camera position
camera.position.z = 25;

// Load 3D model
const loader = new GLTFLoader();

loader.load(
  "./assets/Sandingnew.gltf",

  function (gltf) {
    object = gltf.scene;

    updateModelScale();

  

    scene.add(object);

    updateCameraFraming();
  },

  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),

  (error) => console.error(error),
);

// HDR Environment
const exrLoader = new EXRLoader();

exrLoader.load("./assets/DaySkyHDRI006A_1K_HDR.exr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  scene.environment = texture;
  scene.environmentIntensity = 1.5;

  scene.background = null;
});

// Lighting
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, objToRender === "ring" ? 3 : 1);
scene.add(ambientLight);

// Orbit Controls
if (objToRender === "ring") {
  controls = new OrbitControls(camera, renderer.domElement);

  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
}

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Tooltip
function showTooltip(x, y, text) {
  const tooltip = document.getElementById("tooltip");

  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y + 10}px`;

  tooltip.innerHTML = text;
  tooltip.style.display = "block";
}

function hideTooltip() {
  document.getElementById("tooltip").style.display = "none";
}

// Click interaction
window.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const desc = object.userData.description;

    if (desc) {
      showTooltip(event.clientX, event.clientY, desc);
    }
  } else {
    hideTooltip();
  }
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  if (controls) controls.update();

  if (object && objToRender === "eye") {
    object.rotation.y = -3 + (mouseX / container.clientWidth) * 3;
    object.rotation.x = -1.2 + (mouseY * 2.5) / container.clientHeight;
  }

  renderer.render(scene, camera);
}

// Camera framing based on aspect ratio
function updateCameraFraming() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const aspect = width / height;

  if (!object) return;

  if (aspect > 1.6) {
    // very wide screens (Nest Hub etc.)
    object.scale.set(1.2, 1.2, 1.2);
  } else if (aspect > 1.3) {
    // tablets / laptops
    object.scale.set(1.2, 1.2, 1.2);
  } else {
    // portrait screens
    object.scale.set(1.4, 1.4, 1.4);
  }
}

// Model scale adjustment
function updateModelScale() {
  if (!object) return;

  const width = container.clientWidth;

  if (width < 768) {
    object.scale.set(0.3, 0.3, 0.3);
  } else if (width < 1024) {
    object.scale.set(0.5, 0.5, 0.5);
  } else {
    object.scale.set(1.0, 1.0, 1.0);
  }
}

// Resize handler
function resizeRenderer() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  updateCameraFraming();
  updateModelScale();
}

window.addEventListener("resize", resizeRenderer);

// Mouse tracking
document.addEventListener("mousemove", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();

  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

resizeRenderer();
animate();
