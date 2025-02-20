import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加太阳
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunTexture = new THREE.TextureLoader().load("./img/sun.jpeg"); // 太阳纹理贴图
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture }); // 使用纹理贴图
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(22, 0, 0); // 将太阳向右移动5个单位
scene.add(sun);

// 添加地球
const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
const earthTexture = new THREE.TextureLoader().load("./img/earth.jpeg"); // 地球纹理贴图
const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture }); // 使用纹理贴图
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(44, 0, 0); // 地球距离太阳21个单位（26 - 5 = 21）
earth.rotation.y = (-23.45 * Math.PI) / 180; // 地球倾斜，北极指向右侧
scene.add(earth);

// 添加黄道面（平面）
const eclipticPlaneGeometry = new THREE.BoxGeometry(100, 0.01, 100); // 极薄的长方体
const eclipticPlaneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  opacity: 0.5,
  transparent: true,
});
const eclipticPlane = new THREE.Mesh(
  eclipticPlaneGeometry,
  eclipticPlaneMaterial
);
eclipticPlane.rotation.x = 0; // 旋转平面使其水平
scene.add(eclipticPlane);

// 添加赤道面（平面）
const equatorPlaneGeometry = new THREE.BoxGeometry(10, 0.01, 10); // 极薄的长方体
const equatorPlaneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffa500,
  opacity: 0.5,
  transparent: true,
});
const equatorPlane = new THREE.Mesh(equatorPlaneGeometry, equatorPlaneMaterial);
equatorPlane.rotation.x = 0; // 赤道面应与地球自转轴垂直
equatorPlane.rotation.z = (-23.45 * Math.PI) / 180; // 赤道面与地球自转轴垂直
equatorPlane.position.set(45, 0, 0); // 赤道面与地球球心对齐
scene.add(equatorPlane);

// 绘制地球公转轨道（椭圆）
function createEllipseOrbit(a, b, color) {
  const c = Math.sqrt(a * a - b * b); // 焦点距离
  const curve = new THREE.EllipseCurve(
    5 + c, // 椭圆中心点x（焦点位置 + 太阳的偏移量）
    0, // 椭圆中心点y
    a, // x半轴
    b, // y半轴
    0, // 起始角度
    2 * Math.PI, // 结束角度
    false, // 是否顺时针
    0 // 旋转角度
  );
  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: color,
    dashSize: 0.2,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const line = new THREE.Line(geometry, material);
  line.rotateX(Math.PI / 2); // 旋转到 XOZ 平面
  return line;
}
const orbit = createEllipseOrbit(21, 10, 0xfbff00); // 半长轴为21，半短轴为10
scene.add(orbit);

// 绘制自转轴（虚线）
function drawAxis(position, rotation, length, color) {
  const material = new THREE.LineDashedMaterial({
    color: color,
    dashSize: 0.2,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const geometry = new THREE.BufferGeometry();
  const points = [];
  points.push(new THREE.Vector3(0, -length / 2, 0));
  points.push(new THREE.Vector3(0, length / 2, 0));
  geometry.setFromPoints(points);
  const axis = new THREE.Line(geometry, material);
  axis.position.copy(position);
  axis.rotation.copy(rotation);
  return axis;
}

// 太阳自转轴
const sunAxis = drawAxis(
  new THREE.Vector3(22, 0, 0), // 太阳自转轴位置与太阳对齐
  new THREE.Euler(0, 0, 0), // 太阳自转轴垂直于黄道面
  16,
  0xffffff
); // 白色虚线
scene.add(sunAxis);

// 地球自转轴
const earthAxis = drawAxis(
  new THREE.Vector3(26, 0, 0), // 地球自转轴位置与地球球心对齐
  new THREE.Euler(0, (-23.45 * Math.PI) / 180, 0), // 地球自转轴倾斜23.45度
  10,
  0xffffff
); // 白色虚线
scene.add(earthAxis);

// 控制地球运动
const clock = new THREE.Clock();
let isRunning = false;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (isRunning) {
    const angle = -clock.elapsedTime / 10; // 控制公转速度，取反实现逆时针
    const c = Math.sqrt(21 * 21 - 10 * 10); // 焦点距离
    earth.position.x = 5 + c + 21 * Math.cos(angle); // 椭圆轨道的x坐标（以焦点为基准 + 太阳的偏移量）
    earth.position.z = 10 * Math.sin(angle); // 椭圆轨道的z坐标
    equatorPlane.position.copy(earth.position); // 赤道面跟随地球移动
    earth.rotation.y += 0.04; // 增加地球的自转速度
    earthAxis.position.copy(earth.position); // 地轴跟随地球移动
  }
  renderer.render(scene, camera);
}
animate();

// 添加控制面板
const gui = new GUI();
const params = {
  showEclipticPlane: true,
  showEquatorPlane: true,
  showSunAxis: true,
  showEarthAxis: true,
  showOrbit: true,
  sunColor: 0xff0000,
  earthColor: 0x00ff00,
  orbitColor: 0x0f4984,
  isRunning: false,
};

gui.add(params, "showEclipticPlane").onChange((value) => {
  eclipticPlane.visible = value;
});
gui.add(params, "showEquatorPlane").onChange((value) => {
  equatorPlane.visible = value;
});
gui.add(params, "showSunAxis").onChange((value) => {
  sunAxis.visible = value;
});
gui.add(params, "showEarthAxis").onChange((value) => {
  earthAxis.visible = value;
});
gui.add(params, "showOrbit").onChange((value) => {
  orbit.visible = value;
});
gui.add(params, "isRunning").onChange((value) => {
  isRunning = value;
  if (isRunning) {
    clock.start();
  } else {
    clock.stop();
  }
});

// 新增侧视图按钮
function setSideView() {
  controls.reset(); // 重置相机位置和方向
  camera.position.set(50, 0, 0); // 设置相机到侧视图位置
  camera.lookAt(scene.position); // 让相机看向场景中心
}
gui.add({ setSideView }, "setSideView").name("侧视图");

// 设置相机位置和方向为侧视图
camera.position.set(50, 0, 0); // 设置相机到侧视图位置
camera.lookAt(scene.position); // 让相机看向场景中心

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);

// 窗口尺寸调整
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
