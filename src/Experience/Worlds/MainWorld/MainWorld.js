import * as THREE from 'three'
import Experience from '@experience/Experience.js'
import DebugHelpers from "../Objects/DebugHelpers.js";
import Time from "@experience/Utils/Time.js";
import EventEmitter from '@experience/Utils/EventEmitter.js';
import Debug from '@experience/Utils/Debug.js';

import Camera from './Camera.js'
import Input from "@experience/Utils/Input.js";
import Environment from "./Environment.js";

import BlackHole from "@experience/Worlds/MainWorld/BlackHole.js";
import StarfieldSystem from "@experience/Worlds/MainWorld/StarfieldSystem.js";
import PlanetSystem from "@experience/Worlds/MainWorld/PlanetSystem.js";
import SunSystem from "@experience/Worlds/MainWorld/SunSystem.js";
import DeviceProfile from "@experience/Cosmos/DeviceProfile.js";

import { color, uniform } from "three/tsl";

export default class MainWorld extends EventEmitter {
    experience = Experience.getInstance()
    time = this.experience.time
    debug = this.experience.debug
    state = this.experience.state
    renderer = this.experience.renderer.instance
    scene = new THREE.Scene()
    camera = new Camera( { world: this } )
    input = new Input( { camera: this.camera.instance } )
    resources = this.experience.resources
    html = this.experience.html
    sound = this.experience.sound

    uniforms = this.state.uniforms.mainScene

    enabled = true

    constructor() {
        super();

        this._setDebug()

        this.init()

        this.scene.add( this.camera.instance )
    }

    init() {
        //this.example = new ExampleClass( { world: this } )
        this.blackHole = new BlackHole( { world: this } )

        const profile = this.experience.deviceProfile || new DeviceProfile()
        this.starfield = new StarfieldSystem( {
            scene: this.scene,
            renderer: this.renderer,
            starCount: profile.starCount,
            shellRadius: 500,
        } )

        this.planet = new PlanetSystem( { world: this } )
        
        // Add Sun System in the same direction as the planet's sun direction
        const sunPos = new THREE.Vector3(1.0, 0.2, -0.5).normalize().multiplyScalar(800)
        this.sun = new SunSystem( { scene: this.scene, position: sunPos, resources: this.resources } )

        this.environment = new Environment( { world: this } )

        this.debugHelpers = new DebugHelpers( { world: this } )
    }

    animationPipeline() {
        this.example?.animationPipeline()
        this.blackHole?.animationPipeline()
    }

    postInit() {
        this.example?.postInit()
        this.blackHole?.postInit()
    }

    resize() {
        this.example?.resize()
        this.blackHole?.resize()

        this.camera?.resize()
    }

    async update( deltaTime ) {
        if ( !this.enabled ) return

        this.debugHelpers?.update( deltaTime )
        this.blackHole?.update( deltaTime )
        await this.starfield?.update( deltaTime )
        this.planet?.update( deltaTime )

        this.camera?.update()
    }

    postUpdate( deltaTime ) {

    }

    _setDebug() {
        if ( !this.debug.active ) return

        this.debugFolder = this.debug.panel.addFolder( {
            title: 'Main World', expanded: true
        } )

        const postProcessFolder = this.debugFolder.addFolder( {
            title: 'PostProcess',
            expanded: false
        } )

        // Bloom Pass Preload
        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.strength, 'value', {
            min: 0, max: 5, step: 0.001, label: 'Strength'
        } )

        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.radius, 'value', {
            min: -2, max: 1, step: 0.001, label: 'Radius'
        } )

        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.threshold, 'value', {
            min: 0, max: 1, step: 0.001, label: 'Threshold'
        } )



        // this.debugFolder.addBinding( this.uniforms.compositionColor, 'value', {
        //     label: 'Composition Color',
        //     color: { type: 'float' }
        // } ).on( 'change', () => {
        //     this.water.rectLight1.color = this.uniforms.compositionColor.value
        // } )
        //
        // this.debugFolder.addBinding( this.uniforms.emissiveIntensity, 'value', {
        //     label: 'Emission Intensity',
        //     min: 1,
        //     max: 4
        // } )

    }
}
