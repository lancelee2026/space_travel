import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import {
    Fn, positionLocal, positionWorld, normalWorld, uv, vec2, vec3, float, length, atan, clamp, smoothstep, texture, mul,
    uniform, normalize, max, dot, mix, step, lengthSq, cameraPosition, pow, sqrt,
} from 'three/tsl'

const BODY_RADIUS = 16
const RING_INNER_RATIO = 1.11
const RING_OUTER_RATIO = 2.35
const RING_INNER = BODY_RADIUS * RING_INNER_RATIO
const RING_OUTER = BODY_RADIUS * RING_OUTER_RATIO
const RING_V_SPAN = RING_OUTER_RATIO - RING_INNER_RATIO
const TAU = Math.PI * 2
const RING_BRIGHTNESS = 2.0

export default class PlanetSystem {
    constructor( { world } ) {
        this.world = world
        this.scene = world.scene
        this.camera = world.camera.instance
        this.controls = world.camera.controls
        this.resources = world.resources
        this.isFlying = false

        this.anchor = new THREE.Vector3( -140, 28, -200 )
        this.flyCameraPosition = new THREE.Vector3( -102, 26, -162 )
        this.flyLookAt = this.anchor.clone()

        this.group = new THREE.Group()
        this.group.position.copy( this.anchor )
        this.group.rotation.z = 0.32

        // World space sun direction
        this.sunDirection = new THREE.Vector3(1.0, 0.2, -0.5).normalize()
        this.sunDirUniform = uniform(this.sunDirection)
        
        // Local space sun direction (updated in loop)
        this.localSunDirUniform = uniform(new THREE.Vector3())
        this.ringLocalSunDirUniform = uniform(new THREE.Vector3())

        this._buildPlanet()
        this._buildRings()
        this.scene.add( this.group )
    }

    _prepareTexture( texture, { anisotropy = 8 } = {} ) {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = anisotropy
        texture.needsUpdate = true
        return texture
    }

    _buildPlanet() {
        const map = this._prepareTexture( this.resources.items.saturnMap, { anisotropy: 16 } )
        const ringMap = this._prepareTexture( this.resources.items.saturnRings )

        const geometry = new THREE.SphereGeometry( BODY_RADIUS, 72, 72 )
        const material = new THREE.MeshBasicNodeMaterial()

        const bodyR = float( BODY_RADIUS )
        const innerRatio = float( RING_INNER_RATIO )
        const vSpan = float( RING_V_SPAN )

        material.colorNode = Fn(() => {
            const baseColor = texture(map, uv()).rgb

            const L = this.localSunDirUniform
            const N = normalize(positionLocal) // For a sphere at origin, local position is the normal
            
            // Basic diffuse lighting
            const NdotL = max(dot(N, L), 0.0)
            const diffuse = smoothstep(0.0, 0.5, NdotL) // Soft terminator
            
            // Atmospheric scattering / Rim light
            const V = normalize(cameraPosition.sub(positionWorld)) // World space view
            const NW = normalize(normalWorld) // World space normal
            const NdotV = max(dot(NW, V), 0.0)
            const rim = smoothstep(0.7, 1.0, float(1.0).sub(NdotV))
            const rimColor = vec3(0.5, 0.7, 1.0).mul(rim).mul(diffuse)

            // Ring shadow calculation
            const p = positionLocal
            // Ray: p + t * L. Intersects plane y = 0 when p.y + t * L.y = 0
            const t = p.y.negate().div(L.y)
            const pIntersect = p.add(L.mul(t))
            const r = length(pIntersect.xz)
            
            // Check if intersection is valid (t > 0) and within ring bounds
            const isHitPlane = step(0.0, t)
            
            // Get ring texture at intersection
            const vParam = clamp(r.div(bodyR).sub(innerRatio).div(vSpan), 0, 1)
            const ringSample = texture(ringMap, vec2(vParam, 0.5))
            
            // If inside ring bounds, use texture alpha as shadow, else 1.0 (no shadow)
            const inRingBounds = step(float(RING_INNER), r).mul(step(r, float(RING_OUTER)))
            const shadowStrength = ringSample.a.mul(inRingBounds).mul(isHitPlane)
            
            const shadowFactor = mix(1.0, 0.2, shadowStrength) // 0.2 is ambient in shadow

            // Combine
            const finalColor = baseColor.mul(diffuse).mul(shadowFactor).add(rimColor)
            // Add a tiny bit of ambient
            return finalColor.add(baseColor.mul(0.02))
        })()

        this.mesh = new THREE.Mesh( geometry, material )
        this.mesh.frustumCulled = false
        this.group.add( this.mesh )
    }

    _buildRings() {
        const ringMap = this._prepareTexture( this.resources.items.saturnRings )
        const inner = float( RING_INNER )
        const outer = float( RING_OUTER )
        const edgeSoft = float( 0.35 )
        const bodyR = float( BODY_RADIUS )
        const innerRatio = float( RING_INNER_RATIO )
        const vSpan = float( RING_V_SPAN )

        const ringUV = Fn( () => {
            const r = length( positionLocal.xy )
            const u = atan( positionLocal.y, positionLocal.x ).div( float( TAU ) ).add( 0.5 )
            const v = clamp( r.div( bodyR ).sub( innerRatio ).div( vSpan ), 0, 1 )
            return vec2( v, 0.5 ) // Saturn ring textures are usually mapped horizontally by radius
        } )

        const ringEdgeMask = Fn( () => {
            const r = length( positionLocal.xy )
            const innerFade = smoothstep( inner, inner.add( edgeSoft ), r )
            const outerFade = float( 1 ).sub( smoothstep( outer.sub( edgeSoft ), outer, r ) )
            return innerFade.mul( outerFade )
        } )

        const material = new THREE.MeshBasicNodeMaterial( {
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        } )

        material.colorNode = Fn( () => {
            const sample = texture( ringMap, ringUV() )
            const baseColor = mul( sample.rgb, float( RING_BRIGHTNESS ) )

            const p = positionLocal
            const L = this.ringLocalSunDirUniform
            
            // Planet shadow calculation
            // Ray from p in direction L hits sphere if dot(p, L) < 0 and discriminant > 0
            const b = dot(p, L)
            const c = lengthSq(p).sub(bodyR.mul(bodyR))
            const discriminant = b.mul(b).sub(c)
            
            const isHit = step(0.0, discriminant).mul(step(0.0, b.negate()))
            const shadowFactor = mix(1.0, 0.05, isHit) // 0.05 is ambient in shadow

            // View-dependent scattering (Mie-like forward scattering)
            const V = normalize(cameraPosition.sub(positionWorld))
            const Lw = this.sunDirUniform
            const backScatter = max(dot(V, Lw), 0.0) // 1.0 when looking at sun
            const scatterFactor = mix(1.0, 2.5, pow(backScatter, float(4.0)))

            return baseColor.mul(shadowFactor).mul(scatterFactor)
        } )()

        material.opacityNode = Fn( () => {
            const sample = texture( ringMap, ringUV() )
            return sample.a.mul( ringEdgeMask() ).mul( 0.96 )
        } )()

        const geometry = new THREE.RingGeometry( RING_INNER, RING_OUTER, 256 )
        this.rings = new THREE.Mesh( geometry, material )
        this.rings.rotation.x = Math.PI * 0.5 // Lay it flat
        this.rings.frustumCulled = false
        this.group.add( this.rings )
    }

    flyNear( onComplete ) {
        if ( this.isFlying ) return
        this.isFlying = true
        this.controls.enabled = false

        const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
        const duration = reduced ? 0 : 2.8

        const startPos = this.camera.position.clone()
        const startTarget = this.controls.target.clone()
        const anim = { t: 0 }

        gsap.to( anim, {
            t: 1,
            duration,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.position.lerpVectors( startPos, this.flyCameraPosition, anim.t )
                this.controls.target.lerpVectors( startTarget, this.flyLookAt, anim.t )
                this.controls.update()
            },
            onComplete: () => {
                this.isFlying = false
                this.controls.enabled = true
                onComplete?.()
            },
        } )
    }

    update( deltaTime ) {
        this.group.rotation.y += deltaTime * 0.022
        if ( this.rings ) {
            this.rings.rotation.z += deltaTime * 0.004
        }
        
        // Update local sun direction
        const inverseMatrix = new THREE.Matrix4().copy(this.group.matrixWorld).invert()
        const localSun = this.sunDirection.clone().transformDirection(inverseMatrix).normalize()
        this.localSunDirUniform.value.copy(localSun)

        if (this.rings) {
            const ringInverse = new THREE.Matrix4().copy(this.rings.matrixWorld).invert()
            const ringLocalSun = this.sunDirection.clone().transformDirection(ringInverse).normalize()
            this.ringLocalSunDirUniform.value.copy(ringLocalSun)
        }
    }
}
