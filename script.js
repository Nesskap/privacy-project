////////////////////////
// PRIVACY PROJECT v2.0
//BY NESSKAP
////////////////////////

//IMPORTS ----------------------------------------------------------------------->
import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import * as dat from 'dat.gui'
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import Stats from 'stats.js'
// //<--------------------------------------------------------------------------------END IMPORTS>

//DEBUG ----------------------------------------------------------------------->
/* Stats */
const stats = new Stats()

function debugUI ()
{
    stats.showPanel(0)
    document.body.appendChild(stats.dom)

    const gui = new dat.GUI()
    const parameters = {
    cubeColor: 0xffffff,
    sceneMaterialColor: 0x000000
}

    /* PLAYER DEBUG */
    const playerGUI = gui.addFolder('Player')

    playerGUI
        .add(player,'walk')
        .min(0.05)
        .max(1)
        .step(0.01)
        .name('Speed')
    /////////////////////

    /* MATERIAL DEBUG */
    const materialsGUI = gui.addFolder('Materials')
    const textMaterialGUI = materialsGUI.addFolder('Text Material')
    const sceneMaterialGUI = materialsGUI.addFolder('Scene Material')
    const domeMaterialGUI = materialsGUI.addFolder('Dome Material')

    sceneMaterialGUI
        .addColor(parameters,'sceneMaterialColor')
        .onChange(()=>
        {
            sceneMaterial.color = new THREE.Color(parameters.sceneMaterialColor)
        })
    
    sceneMaterialGUI.add(sceneMaterial,'opacity').min(0).max(1).step(0.01)
    /////////////////////

    //Cube color
    materialsGUI
        .addColor(parameters,'cubeColor')
        .onChange(()=>
        {
            cube.material.color = new THREE.Color(parameters.cubeColor)
        })

    /* END LIGHT DEBUG */
    const endlightGUI = gui.addFolder('End Light')

    endlightGUI.add(spotlightArray[spotlightArray.length-1],'power').min(0).max(100).step(0.5)

    endlightGUI.add(spotlightArray[spotlightArray.length-1],'angle').min(0).max(3).step(0.01)

    endlightGUI.add(spotlightArray[spotlightArray.length-1],'distance').min(0).max(300).step(1)

    endlightGUI.add(spotlightArray[spotlightArray.length-1],'penumbra').min(0).max(1).step(0.01)

    endlightGUI.add(spotlightArray[spotlightArray.length-1],'decay').min(1).max(2).step(0.01)
    /////////////////////
}
//<--------------------------------------------------------------------------------END DEBUG>

//UI ----------------------------------------------------------------------->
var imgSpeaker = document.createElement('img')
imgSpeaker.src = './icons/speakerIcon.png'
imgSpeaker.id = 'mute'
var imgFullscreen = document.createElement('img')
imgFullscreen.src = './icons/fullscreenIcon.png'
imgFullscreen.id = 'fullscreen'

var src = document.querySelector('.icons');
src.appendChild(imgSpeaker);
src.appendChild(imgFullscreen);

document.getElementById('fullscreen').addEventListener("click", ()=>
{
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    var elem = document.documentElement

    if (!fullscreenElement)
    {
        if(elem.requestFullscreen)
        {
            elem.requestFullscreen()
        }
        else if (elem.webkitRequestFullscreen)
        {
            elem.webkitRequestFullscreen()
        }
    }
    else
    {
        
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if (document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
});

/* BACKGROUND MUSIC */
var audio = new Audio('/sounds/SuspenseMusic_DAGAProds.mp3');

audio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);

document.getElementById('mute').addEventListener("click", ()=>
{
    if (audio.paused) {
        audio.play();
        audio.volume = 0.5
    } else{
        audio.pause()
    }
})
//<-------------------------------------------------------------------------------- END UI>

//SCENE ----------------------------------------------------------------------->
const scene = new THREE.Scene();

const loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.OrthographicCamera(-2,2,2,-2,0.1,100),
    loadingBar: new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1,1),
        new THREE.MeshBasicMaterial({color: 0xffffff})
        )
}

let RESOURCES_LOADED = false

loadingScreen.loadingBar.scale.set(0, 0.01)
loadingScreen.camera.position.z = 1
loadingScreen.scene.add(loadingScreen.loadingBar)
//<--------------------------------------------------------------------------------END SCENE>

//LOADING OVERLAY ----------------------------------------------------------------------->
const loadingManager = new THREE.LoadingManager()

loadingManager.onProgress = function(item, loaded, total){
    // console.log( 'Loading file: ' + item + '.\nLoaded ' + loaded + ' of ' + total + ' files.' );
    loadingScreen.loadingBar.scale.x = (4/total) * loaded
};

loadingManager.onLoad = function(){
    console.log( 'Loading complete!');

    loadingScreen.loadingBar.geometry.dispose()
    loadingScreen.loadingBar.material.dispose()
    loadingScreen.scene.remove(loadingScreen.loadingBar)

    //Add UI
    const ui = document.querySelector('.ui')
    ui.classList.add('visible')
    const uiIcons = document.querySelector('.icons')
    uiIcons.classList.add('visible')
};

document.querySelector('.label').addEventListener("click", ()=>
{
    document.querySelector('.label').style.opacity = `0`
    RESOURCES_LOADED = true
    audio.play();
})
//<--------------------------------------------------------------------------------END LOADING OVERLAY>

//RESIZE RENDER ----------------------------------------------------------------------->
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize',() => 
    {
        //animate sizes
        sizes.width = innerWidth;
        sizes.height = innerHeight;

        //animate Camera
        loadingScreen.camera.aspect = sizes.width / sizes.height
        loadingScreen.camera.updateProjectionMatrix()
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        //animate Renderer
        renderer.setSize(sizes.width,sizes.height)
    })
//<--------------------------------------------------------------------------------END RESIZE>

//LIGHTS ----------------------------------------------------------------------->
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
ambientLight.position.set(0,1,0)
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 10)
spotLight.position.set(0,10,0)
spotLight.angle = Math.PI / 4
spotLight.distance = 20
spotLight.penumbra = 1;
spotLight.decay = 2;

spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 9;
spotLight.shadow.camera.far = 200;
spotLight.shadow.focus = 1;

scene.add(spotLight)

const spotlightArray = []
const spotlightsTargets = []

const textsDistance = 33

for (let i= 0; i < 6; i++) {
    //Spotlight Targets to aim down
    spotlightsTargets.push(new THREE.Object3D())
    spotlightsTargets[i].position.set(0, 0, (i+1) * -textsDistance)
    scene.add(spotlightsTargets[i])

    spotlightArray.push(spotLight.clone())
    spotlightArray[i].position.set(0, 10, (i+1) * -textsDistance)
    spotlightArray[i].target = spotlightsTargets[i]
    scene.add(spotlightArray[i])
}

spotlightArray[spotlightArray.length-1].position.set(0, 10, -275)
spotlightsTargets[spotlightsTargets.length-1].position.set(0, 0, -275)
spotlightArray[spotlightArray.length-1].target = spotlightsTargets[spotlightsTargets.length-1]
spotlightArray[spotlightArray.length-1].power = 100
spotlightArray[spotlightArray.length-1].angle = 1.72
spotlightArray[spotlightArray.length-1].distance = 289
spotlightArray[spotlightArray.length-1].penumbra = 1
spotlightArray[spotlightArray.length-1].decay = 2

//<--------------------------------------------------------------------------------END LIGHTS>

//CAMERA ----------------------------------------------------------------------->
const camera = new THREE.PerspectiveCamera(65,sizes.width/sizes.height,0.01,1000);
camera.position.set(0,0,18)
camera.lookAt(0,0,0)
scene.add(camera)
//<--------------------------------------------------------------------------------END CAMERA>

//TEXTURES ----------------------------------------------------------------------->
const textureLoader = new THREE.TextureLoader(loadingManager)

const matcapTexture = textureLoader.load('/textures/matcaps/0.png')
//<--------------------------------------------------------------------------------END TEXTURES>

//FONTS ----------------------------------------------------------------------->
const fontLoader = new THREE.FontLoader(loadingManager)

const matcapMaterial = new THREE.MeshMatcapMaterial({matcap:matcapTexture, transparent:true, opacity:1})

let textMesh1 = null
let textMesh2 = null
let textMesh3 = null
let textMesh4 = null
let textMesh5 = null
let textsY = -3

fontLoader.load(
    '/fonts/Staatliches_Regular.json',
    (font)=>
    {
        const text1 = 'Hello.\nWelcome Again.'
        const text2 = 'Yes.\nYou have been here before.'
        const text3 = 'Trust me.'
        const text4 = '¿Are you in control\nof yourlife?'
        const text5 = 'Enjoy.'

        const textGeometry1 = new THREE.TextBufferGeometry(
            text1,
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 2                
            }
        )
        textGeometry1.center()

        textMesh1 = new THREE.Mesh(textGeometry1,matcapMaterial)
        textMesh1.castShadow = true
        textMesh1.position.set(0,textsY,0)
        textMesh1.rotation.set(-0.05,-0.05,0)

        const textGeometry2 = new THREE.TextBufferGeometry(
            text2,
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 2                
            }
        )
        textGeometry2.center()

        textMesh2 = new THREE.Mesh(textGeometry2,matcapMaterial)
        textMesh2.castShadow = true
        textMesh2.position.set(0,textsY,-textsDistance)
        textMesh2.rotation.set(-0.05,-0.05,0)

        const textGeometry3 = new THREE.TextBufferGeometry(
            text3,
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 2                
            }
        )
        textGeometry3.center()

        textMesh3 = new THREE.Mesh(textGeometry3,matcapMaterial)
        textMesh3.castShadow = true
        textMesh3.position.set(0,textsY,-textsDistance*2)
        textMesh3.rotation.set(-0.05,-0.05,0)

        const textGeometry4 = new THREE.TextBufferGeometry(
            text4,
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 2                
            }
        )
        textGeometry4.center()

        textMesh4 = new THREE.Mesh(textGeometry4,matcapMaterial)
        textMesh4.castShadow = true
        textMesh4.position.set(0,textsY,-textsDistance*3)
        textMesh4.rotation.set(-0.05,-0.05,0)

        const textGeometry5 = new THREE.TextBufferGeometry(
            text5,
            {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 2                
            }
        )
        textGeometry5.center()

        textMesh5 = new THREE.Mesh(textGeometry5,matcapMaterial)
        textMesh5.castShadow = true
        textMesh5.position.set(0,textsY,-textsDistance*4)
        textMesh5.rotation.set(-0.05,-0.05,0)
        
        //Add Texts to Scene
        scene.add(textMesh1, textMesh2, textMesh3, textMesh4, textMesh5)
    }
)

//<-------------------------------------------------------------------------------- END FONTS>

//MODELS ----------------------------------------------------------------------->
/* Loaders */
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

/* Materials */
const sceneMaterial = new THREE.MeshStandardMaterial()
sceneMaterial.color = new THREE.Color('black')

const domeInMaterial = new THREE.MeshBasicMaterial()
domeInMaterial.color = new THREE.Color('black')
domeInMaterial.transparent = true;
domeInMaterial.opacity = 0.5

const domeExtMaterial = new THREE.MeshBasicMaterial()
domeExtMaterial.color = new THREE.Color('black')

const boundingBoxMaterial = new THREE.MeshBasicMaterial()
boundingBoxMaterial.color = new THREE.Color('black')
boundingBoxMaterial.transparent = true;
boundingBoxMaterial.opacity = 0

gltfLoader.load(
    '/models/scene/pathDome2.glb',
    (glb) =>
    {
        const children = [...glb.scene.children]

        for(const child of children)
        { 
            switch (child.name){
                case 'boundingBox':
                    child.material = boundingBoxMaterial
                    break;
                case 'domeInside':
                    child.material = domeInMaterial
                    break;
                case 'domeExterior':
                    child.material =domeExtMaterial
                    break;
                case 'path':
                case 'domeFloor':
                    child.material = sceneMaterial
                    child.receiveShadow = true;
                    break;
            }  
        
            scene.add(child)
        }
    },
)

const expositorsMaterial = new THREE.MeshLambertMaterial({color: 'black'})
gltfLoader.load(
    '/models/scene/expositors.glb',
    (glb)=>
    {
        glb.scene.children[0].material = expositorsMaterial
        glb.scene.children[0].receiveShadow = true;
        scene.add(glb.scene.children[0])
    }
)

gltfLoader.load('/models/people/AnaGarza.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/AngelLeon.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/BetoRamos.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/HectorGutierrez.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/JorgeLorenzo.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/JorgeNavarro.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/KarlaVelazquez.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/LorenaNajera.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/MarthaMendoza.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/MiguelAlayo.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/Ness.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/NicoleLeon.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/OscarLopez.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})
gltfLoader.load('/models/people/RobertoGonzalez.gltf',(gltf)=>{scene.add(gltf.scene.children[0])})


//<--------------------------------------------------------------------------------END MODELS>

//RENDERER ----------------------------------------------------------------------->
const canvas = document.querySelector('.myCanvas')

const renderer = new THREE.WebGLRenderer ({canvas: canvas, antialias: true})
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(sizes.width,sizes.height)

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

// renderer.render(scene, camera)
//<--------------------------------------------------------------------------------END RENDERER>

//FIRST PERSON CONTROLS ----------------------------------------------------------------------->
/* CAMERA MOVEMENT */
const controls = new PointerLockControls(camera, canvas);
// Adds a listener to when the canvas element has been clicked.
// Once clicked the controls are locked and can be used. To escape the controls just press ESC
canvas.addEventListener('click', () => 
{
    controls.lock();
})
//<--------------------------------------------------------------------------------END CAMERA MOVEMENT>

/* PLAYER MOVEMENT */
const player = 
{
    walk: 0.1,
    run: 0.9
}
let isMoving = false;
let isForward = false;
let isBackward = false;
let isLeft = false;
let isRight = false;
const distanceBounds = [ 0.001, 1 ];

function onKeyDown(event) {
    // switch ((String.fromCharCode(event.which)).toUpperCase())
    switch (event.key.toUpperCase()) {
        case 'W':
        case 'ARROWUP':
            isMoving = true;
            isForward = true;
            break;
        case 'S':
        case 'ARROWDOWN':
            isMoving = true;
            isBackward = true;
            break;
        case 'A':
        case 'ARROWLEFT':
            isMoving = true;
            isLeft = true;
            break
        case 'D':
        case 'ARROWRIGHT':
            isMoving = true;
            isRight = true;
            break;
        case 'SHIFT':
            if (player.walk < player.run){
                player.walk += player.run
                gui.animateDisplay()
            }
            break;
    }
}

function onKeyUp(event) {
    // switch ((String.fromCharCode(event.which)).toUpperCase())
    switch (event.key.toUpperCase()) {
        case 'W':
        case 'ARROWUP':
            isForward = false;
            break;
        case 'S':
        case 'ARROWDOWN':
            isBackward = false;
            break;
        case 'A':
        case 'ARROWLEFT':
            isLeft = false;
            break;
        case 'D':
        case 'ARROWRIGHT':
            isRight = false;
            break;
        case 'SHIFT':
            player.walk -= player.run
            gui.animateDisplay()
            break;
    }
    if (!isForward && !isBackward && !isLeft && !isRight)
        isMoving = false;
}

function listen() {
    window.addEventListener('keydown', (event) => onKeyDown(event), false);
    window.addEventListener('keyup', (event) => onKeyUp(event), false);
}

function move() {  

    let rays = [];
    let pos = controls.getObject().position,
        dir = controls.getDirection(new THREE.Vector3).clone();

    //Create rays around player
    for (let i = 0; i < 8; i++) {
        rays.push(
            new THREE.Raycaster(new THREE.Vector3(pos.x, 0, pos.z),
                new THREE.Vector3(
                    dir.x * Math.cos(-Math.PI / 4 * i) - dir.z * Math.sin(-Math.PI / 4 * i),
                    -.5,
                    dir.x * Math.sin(-Math.PI / 4 * i) + dir.z * Math.cos(-Math.PI / 4 * i)
                ), //BACK/FRONT WORK others don't
                distanceBounds[0],
                distanceBounds[1])
        );
    }

    //Check for intersection
    for (let i = 0; i < rays.length; i++) {
        let intersects = rays[i].intersectObjects(scene.children, true);
            
        //Check direction
        if (intersects.length > 0) {

            if (intersects[0].distance <= 0.3)
                if (isMoving) {
                    //Front
                    if (i == 0) {
                        //console.log(rays);
                        console.log('front');
                        isForward = false;
                    }
                    //Front-Left
                    if (i == 1) {
                        console.log('front-left');
                        isForward = false;
                        isLeft = false;
                    }
                    //Left
                    if (i == 2) {
                        console.log('left');
                        isLeft = false;
                    }
                    //Back-Left
                    if (i == 3) {
                        console.log('back-left');
                        isBackward = false;
                        isLeft = false;
                    }
                    //Back
                    if (i == 4) {
                        console.log('back');
                        isBackward = false;
                    }
                    //Back-Right
                    if (i == 5) {
                        console.log('back-left');
                        isBackward = false;
                        isRight = false;
                    }
                    //Right
                    if (i == 6) {
                        console.log('right');
                        isRight = false;
                    }
                    ////Front-right
                    if (i == 7) {
                        console.log('front-right');
                        isForward = false;
                        isRight = false;
                    }
                }
        }
    }

    if (isMoving) {
        if (isForward) {
            controls.moveForward(player.walk);
        }
        if (isBackward) {
            controls.moveForward(-player.walk);
        }
        if (isRight) {
            controls.moveRight(player.walk / 2);
        }
        if (isLeft) {
            controls.moveRight(-player.walk / 2);
        }
        camera.position.set = pos;
    }
}
//<-------------------------------------------------------------------------------- END PLAYER MOVEMENT>
//<-------------------------------------------------------------------------------- END FISRT PLAYER CONTROLS>

//animate EVERY FRAME ----------------------------------------------------------------------->
const clock = new THREE.Clock();

scene.fog = new THREE.Fog(0x000000,30,100)
let changeFog = false

//Function to change the fog inside the dome
function fog(eventFog)
{
    if (eventFog)
        gsap.to(scene.fog, {near:30, far: 50, duration:.5, ease: "sine.inOut"})
    else
        gsap.to(scene.fog, {near:50, far: 100, duration:.5, ease: "sine.inOut"})
}

//Function to trigger the texts
let textTrigger1 = false
let textTrigger2 = false
let textTrigger3 = false
let textTrigger4 = false
let textTrigger5 = false

const durationTime = 4

function textTrigger(meshtoTrigger,active) {
    if (!active){
        gsap.from(meshtoTrigger.material, {opacity: 0, duration: durationTime, ease:"sine.Out"})
        gsap.to(meshtoTrigger.position, {y:"+=3", duration: durationTime, ease: "sine.Out"})
        gsap.to(meshtoTrigger.position, {repeat: -1, yoyo: true, y:"-=.3", delay: durationTime, duration: 3, ease: "sine.inOut"})
        gsap.to(meshtoTrigger.rotation, {repeat: -1, yoyo: true, x:"+=.1", y: "+=.1", delay: durationTime, duration: 3, ease: "sine.inOut"})
    }
}

function animate() {

    if (RESOURCES_LOADED == false){
        requestAnimationFrame(animate)

        renderer.render(loadingScreen.scene,loadingScreen.camera)
        return
    }

    stats.begin()

    const elapsedTime = clock.getElapsedTime()

    requestAnimationFrame(animate)

    move();

    // console.log(camera.position.z);

    if (camera.position.z < 15 && camera.position.z > -5){
        textTrigger(textMesh1, textTrigger1)
        textTrigger1 = true
    }      
    if (camera.position.z < -15 && camera.position.z > -35){
        textTrigger(textMesh2, textTrigger2)
        textTrigger2 = true
    }
    if (camera.position.z < -45 && camera.position.z > -65){
        textTrigger(textMesh3, textTrigger3)
        textTrigger3 = true
    }
    if (camera.position.z < -75 && camera.position.z > -95){
        textTrigger(textMesh4, textTrigger4)
        textTrigger4 = true
    }
    if (camera.position.z < -105 && camera.position.z > -125){
        textTrigger(textMesh5, textTrigger5)
        textTrigger5 = true
    }

    //Fog Change
    if (camera.position.z >-173)
    {
        changeFog = true;
        fog(changeFog)
    }
    else
    {
        changeFog = false;
        fog(changeFog)
    }

    // Render every frame
    renderer.render(scene, camera);

    stats.end()
}

// debugUI()
listen()
animate()
//<-------------------------------------------------------------------------------- END animate EVERY FRAME>
