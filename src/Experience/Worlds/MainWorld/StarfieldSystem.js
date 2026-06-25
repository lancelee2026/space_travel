/**
 * Static spherical starfield — adapted from dgreenheck/webgpu-galaxy (MIT)
 * Uniform shell distribution + blackbody-style color mix, slow Y rotation.
 */

import * as THREE from 'three/webgpu'
import {
    Fn, float, vec3, vec4, uv, uniform, instancedArray, instanceIndex,
    mix, length, sin, cos, fract, smoothstep, time, acos, clamp,
} from 'three/tsl'

const hash = Fn( ( [ seed ] ) => {
    const p = fract( seed.mul( 0.1031 ) )
    const h = p.add( 19.19 )
    return fract( h.mul( h.add( 47.43 ) ).mul( p ) )
} )

const rotateY = Fn( ( [ position, angle ] ) => {
    const c = cos( angle )
    const s = sin( angle )
    const x = position.x.mul( c ).sub( position.z.mul( s ) )
    const z = position.x.mul( s ).add( position.z.mul( c ) )
    return vec3( x, position.y, z )
} )

export default class StarfieldSystem {
    constructor( { scene, renderer, starCount = 60000, shellRadius = 500 } ) {
        this.scene = scene
        this.renderer = renderer
        this.starCount = starCount
        this.shellRadius = shellRadius
        this.initialized = false
        this.rotationAngle = 0

        this.uniforms = {
            shellRadius: uniform( shellRadius ),
            rotationSpeed: uniform( 0.0 ),   // Completely static, no skybox rotation
            particleSize: uniform( 0.06 ),   // Very tiny pinpoints
            hotColor: uniform( new THREE.Color( 0.85, 0.90, 1.0 ) ),
            coolColor: uniform( new THREE.Color( 1.0, 0.80, 0.60 ) ),
        }

        this.positionBuffer = instancedArray( this.starCount, 'vec3' )
        this.temperatureBuffer = instancedArray( this.starCount, 'float' )

        this._buildCompute()
        this._buildMesh()
    }

    _buildCompute() {
        // One-time init compute: generate static positions on GPU
        this.computeInit = Fn( () => {
            const idx = instanceIndex
            const seed = idx.toFloat()

            const u = hash( seed.add( 1.0 ) )
            const v = hash( seed.add( 2.0 ) )
            const w = hash( seed.add( 3.0 ) )

            const theta = u.mul( 6.28318 )
            const phi = acos( float( 1.0 ).sub( v.mul( 2.0 ) ) )
            const radius = this.uniforms.shellRadius.mul( float( 0.92 ).add( w.mul( 0.08 ) ) )

            const sinPhi = sin( phi )
            const x = sinPhi.mul( cos( theta ) ).mul( radius )
            const y = cos( phi ).mul( radius )
            const z = sinPhi.mul( sin( theta ) ).mul( radius )

            this.positionBuffer.element( idx ).assign( vec3( x, y, z ) )

            const temp = hash( seed.add( 4.0 ) )
            this.temperatureBuffer.element( idx ).assign( temp )
        } )().compute( this.starCount )
    }

    _buildMesh() {
        const material = new THREE.SpriteNodeMaterial()
        material.transparent = true
        material.depthWrite = false
        material.blending = THREE.AdditiveBlending

        const starPos = this.positionBuffer.toAttribute()
        const temp = this.temperatureBuffer.toAttribute()

        const circleShape = Fn( () => {
            const center = uv().sub( 0.5 ).mul( 2.0 )
            const dist = length( center )
            // Tiny anti-aliasing to prevent pixelation/shimmering
            return smoothstep( 1.0, 0.8, dist )
        } )()

        // Very subtle brightness variation (not twinkling — just star magnitude)
        const magnitude = fract( temp.mul( 17.3 ) ).mul( 0.5 ).add( 0.5 )

        const starColor = mix(
            vec3( this.uniforms.coolColor ),
            vec3( this.uniforms.hotColor ),
            temp,
        )

        material.positionNode = starPos
        material.colorNode = vec4( starColor.x, starColor.y, starColor.z, float( 1.0 ) ).mul( magnitude )
        material.opacityNode = circleShape
        material.scaleNode = this.uniforms.particleSize

        this.mesh = new THREE.Sprite( material )
        this.mesh.count = this.starCount
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = -1

        this.scene.add( this.mesh )
    }

    setStarCount( count ) {
        if ( count === this.starCount ) return
        this.destroy()
        this.starCount = count
        this.positionBuffer = instancedArray( this.starCount, 'vec3' )
        this.basePositionBuffer = instancedArray( this.starCount, 'vec3' )
        this.temperatureBuffer = instancedArray( this.starCount, 'float' )
        this.initialized = false
        this._buildCompute()
        this._buildMesh()
    }

    async update( deltaTime ) {
        if ( !this.initialized ) {
            await this.renderer.computeAsync( this.computeInit )
            this.initialized = true
        }
        // Rotation via CPU (avoids per-frame 60k-particle GPU compute)
        if ( this.mesh ) {
            this.mesh.rotation.y += deltaTime * this.uniforms.rotationSpeed.value
        }
    }

    destroy() {
        if ( this.mesh ) {
            this.scene.remove( this.mesh )
            this.mesh.material?.dispose()
            this.mesh = null
        }
    }
}
