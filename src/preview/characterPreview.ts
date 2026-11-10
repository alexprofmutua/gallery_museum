import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const starfishPreview = new URLSearchParams(location.search).get("character") === "starfish";
if (starfishPreview) {
  document.title = "Starfish · Character preview";
  document.querySelector("h1")!.textContent = "Starfish, in coral.";
  document.querySelector("header p")!.textContent = "Approved Starfish character: long dark braids, a coral top and ivory trousers. Now in your local museum.";
  document.querySelector("aside h2")!.textContent = "Her references";
  document.querySelector("aside > p")!.textContent = "Please judge her face, braids and outfit. This is a stylized interpretation of your photographs.";
  const references = [
    ["graduate-dsc-4003", "Face and braid detail"],
    ["photo-23", "Hair length and overall appearance"],
    ["photo-01", "Full-body proportions"]
  ];
  document.querySelectorAll<HTMLElement>(".references figure").forEach((figure, index) => {
    const [id, caption] = references[index];
    const img = figure.querySelector("img")!;
    img.src = `/images/memories/${id}.jpg`;img.alt = caption;
    figure.querySelector("figcaption")!.textContent = caption;
  });
  document.querySelector(".notice")!.textContent = "Her approved character is integrated in your local museum. Choose Starfish and press V to use character view.";
}
const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const status = document.querySelector<HTMLElement>("#status")!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#e7e7e2");
scene.fog = new THREE.Fog("#e7e7e2", 8, 18);
const camera = new THREE.PerspectiveCamera(34, 1, .05, 50);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, .96, 0); controls.enableDamping = true;
controls.minDistance = .45; controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI * .55;
camera.position.set(2.6, 1.5, 4);
const pmrem = new THREE.PMREMGenerator(renderer), studio = new RoomEnvironment();
const probe = pmrem.fromScene(studio, .04);scene.environment = probe.texture;scene.environmentIntensity = .5;
studio.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight("#fff5e8", "#a2aaa0", 1.3));
const key = new THREE.DirectionalLight("#fff2df", 2.5);key.position.set(-2, 4, 3);key.castShadow = true;
key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:10});key.shadow.bias=-.0001;key.shadow.normalBias=.015;scene.add(key);
const fill = new THREE.DirectionalLight("#cbdfff", 1);fill.position.set(3, 2, 1);scene.add(fill);
const rim = new THREE.DirectionalLight("#fff3dc", 1.5);rim.position.set(1, 3, -2);scene.add(rim);
const floorCanvas = document.createElement("canvas");floorCanvas.width=floorCanvas.height=256;
const ctx=floorCanvas.getContext("2d")!;ctx.fillStyle="#dcded8";ctx.fillRect(0,0,256,256);ctx.strokeStyle="#cdd2c9";ctx.lineWidth=1;ctx.strokeRect(.5,.5,255,255);
const grid = new THREE.CanvasTexture(floorCanvas);grid.colorSpace=THREE.SRGBColorSpace;grid.wrapS=grid.wrapT=THREE.RepeatWrapping;grid.repeat.set(40,40);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:grid,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
let mixer: THREE.AnimationMixer | undefined, active: THREE.AnimationAction | undefined;
let gltfAnimations: THREE.AnimationClip[] = [], mode="Idle";
let model: THREE.Group | undefined;
const speeds: Record<string,number> = {Idle:0,Walk:1.5,Run:4.2,Sprint:6.5,Turn:0};
const setAction = (name:string) => {
  const clip=gltfAnimations.find(c=>c.name===name || c.name.endsWith(`|${name}`));
  if(!mixer || !clip)return;
  const next=mixer.clipAction(clip);if(next===active)return;
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();active?.crossFadeTo(next,.22,false);active=next;mode=name;
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.action===name)));
};
new GLTFLoader().load(starfishPreview ? "/girlfriend-preview/starfish-preview.glb?v=1" : "/character-preview/alex-preview.glb?hair=taper-v1", gltf=>{
  model=gltf.scene;model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o.material instanceof THREE.MeshStandardMaterial)o.material.envMapIntensity=.65;}});
  scene.add(model);mixer=new THREE.AnimationMixer(model);gltfAnimations=gltf.animations;setAction("Idle");
  let triangles=0;model.traverse(o=>{if(o instanceof THREE.Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  status.textContent=`${Math.round(triangles).toLocaleString()} triangles · ${gltf.animations.length} motion clips`;
  canvas.dataset.loaded="true";canvas.dataset.clips=gltf.animations.map(c=>c.name).join(",");
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>{b.disabled=!gltf.animations.some(c=>c.name===b.dataset.action);});
},undefined,error=>{status.id="error";status.textContent="The approval model is not ready. Open this page using the personal museum preview.";console.error(error);});
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.onclick=()=>setAction(b.dataset.action!));
const views:Record<string,number[]>={"three-quarter":[2.6,1.5,4],front:[0,1.1,4.4],back:[0,1.1,-4.4],left:[-4.4,1.1,0],right:[4.4,1.1,0],face:[.08,starfishPreview?1.65:1.70,1.05]};
document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(b=>b.onclick=()=>{
  const name=b.dataset.view!;camera.position.set(...views[name] as [number,number,number]);controls.target.set(0,name==="face"?(starfishPreview?1.64:1.69):.96,0);controls.update();
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(button=>button.setAttribute("aria-pressed",String(button===b)));
});
const resize = ()=>{const box=canvas.parentElement!.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();};
new ResizeObserver(resize).observe(canvas.parentElement!);resize();
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const delta=Math.min(clock.getDelta(),.05);mixer?.update(delta);controls.update();if(speeds[mode])grid.offset.y=(grid.offset.y-delta*speeds[mode])%1;renderer.render(scene,camera);if(model)canvas.dataset.action=mode;});
