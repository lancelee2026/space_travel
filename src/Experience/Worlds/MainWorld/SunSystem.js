import * as THREE from 'three/webgpu'
import { float, max, pow, length, uv, smoothstep, color, Fn, vec2, texture, mix, sin, vec4, time } from 'three/tsl'

export default class SunSystem {
    constructor( { scene, position, resources } ) {
        this.scene = scene
        this.position = position
        this.resources = resources
        
        this.init()
    }
    
    init() {
        const material = new THREE.SpriteNodeMaterial()
        material.transparent = true
        material.depthWrite = false
        material.blending = THREE.AdditiveBlending
        
        const noiseTex = this.resources.items.noiseDeepTexture
        
        // Animated time using TSL built-in uniform
        const t = time.mul(0.5)
        
        const sunShader = Fn( () => {
            const center = uv().sub( 0.5 ).mul( 2.0 ) // -1 to 1
            const dist = length( center )
            
            // Radial angle for coronal flares
            const angle = vec2( center.x, center.y ).normalize()
            
            // Sample noise for the surface
            const uv1 = uv().mul(1.5).add( t.mul(0.1) )
            const uv2 = uv().mul(2.0).sub( t.mul(0.15) )
            const n1 = texture( noiseTex, uv1 ).r
            const n2 = texture( noiseTex, uv2 ).g
            const noiseSurface = n1.mul(n2).mul(2.0)
            
            // Sample noise for the corona (using angle and distance)
            const coronaUv = center.normalize().mul(0.2).add( t.mul(0.05) ).add( center.mul(0.1) )
            const coronaNoise = texture( noiseTex, coronaUv ).b
            
            // Core of the sun (solid circle with noise)
            const coreRadius = float( 0.15 )
            const coreMask = smoothstep( coreRadius, coreRadius.sub(0.02), dist )
            const coreColor = mix( color('#fff4e6'), color('#ffd6a5'), noiseSurface )
            
            // Corona glow with flares
            const glowDist = max( 0.0, float(1.0).sub(dist.mul(1.5)) )
            const flare = pow( glowDist, 3.5 ).mul( coronaNoise ).mul( 1.5 )
            const ambientGlow = pow( glowDist, 4.0 ).mul( 0.8 )
            const coronaMask = max( flare, ambientGlow ).mul( smoothstep(0.0, coreRadius, dist) )
            const coronaColor = color('#ff9e00')
            
            // Combine
            const finalColor = mix( coronaColor.mul(coronaMask), coreColor, coreMask )
            const finalAlpha = max( coreMask, coronaMask )
            
            return vec4( finalColor, finalAlpha )
        } )()
        
        // Extremely bright multiplier
        material.colorNode = vec4(sunShader.rgb.mul( 2.5 ), 1.0)
        material.opacityNode = sunShader.a
        
        this.mesh = new THREE.Sprite( material )
        this.mesh.position.copy( this.position )
        this.mesh.scale.set( 160, 160, 1 )
        
        this.scene.add( this.mesh )
    }
}
