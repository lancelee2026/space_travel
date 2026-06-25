import { icon } from './icons.js'
import * as THREE from 'three'

export default class DiscoveryOverlay {
    constructor( { root, hotspots, facts, onHotspotOpen, onSheetClose, isMobile } ) {
        this.root = root
        this.hotspots = hotspots
        this.facts = facts
        this.onHotspotOpen = onHotspotOpen
        this.onSheetClose = onSheetClose
        this.isMobile = isMobile
        this.layer = document.createElement( 'div' )
        this.layer.className = 'cosmos-hotspot-layer'
        this.mounted = false
        this.buttons = []
        this.sheet = null
    }

    mount() {
        if ( this.mounted ) return
        this.mounted = true

        this.root.appendChild( this.layer )
        this._layoutHotspots()
    }

    destroy() {
        this.layer.remove()
        this._closeSheet()
    }

    setVisible( visible ) {
        this.layer.style.display = visible ? 'block' : 'none'
    }

    _layoutHotspots() {
        this.buttons.forEach( ( b ) => b.el.remove() )
        this.buttons = []

        for ( const spot of this.hotspots ) {
            const btn = document.createElement( 'button' )
            btn.type = 'button'
            btn.className = 'cosmos-hotspot'
            btn.setAttribute( 'aria-label', `了解${ spot.label }` )
            
            // New Sci-Fi DOM structure
            btn.innerHTML = `
                <div class="cosmos-hotspot__anchor"></div>
                <div class="cosmos-hotspot__line"></div>
                <div class="cosmos-hotspot__label">${ spot.label }</div>
            `
            
            btn.addEventListener( 'click', () => this.openFact( spot ) )
            this.layer.appendChild( btn )
            
            this.buttons.push( {
                el: btn,
                spot: spot,
                vec: new THREE.Vector3( spot.position.x, spot.position.y, spot.position.z )
            } )
        }
    }

    update( camera, planetSystem ) {
        if ( !this.mounted || !camera ) return
        
        for ( const b of this.buttons ) {
            // Clone the base position
            const pos = b.vec.clone()
            
            // Project 3D position to 2D normalized device coordinates (NDC)
            // If the hotspot belongs to the planet, sync with its actual dynamic position
            if ( b.spot.id === 'distant-planet' && planetSystem ) {
                pos.copy( planetSystem.group.position )
            } else if ( b.spot.id === 'background-stars' ) {
                // Background stars are at infinity, so they shouldn't have parallax
                pos.copy( camera.position ).add( b.vec.clone().normalize().multiplyScalar( 1000 ) )
            } else if ( b.spot.id === 'sun' && planetSystem ) {
                // Point to the sun! The sun is in the direction of the planet's sunDirection
                const sunDir = new THREE.Vector3(1.0, 0.2, -0.5).normalize()
                pos.copy( sunDir.multiplyScalar( 800 ) )
            }
            
            pos.project( camera )
            
            // Check if point is behind the camera (z > 1)
            if ( pos.z > 1 ) {
                b.el.classList.add('is-hidden')
                continue
            } else {
                b.el.classList.remove('is-hidden')
            }
            
            // Convert NDC to screen pixels
            const x = ( pos.x * 0.5 + 0.5 ) * window.innerWidth
            const y = ( -pos.y * 0.5 + 0.5 ) * window.innerHeight
            
            // Apply transform for smooth sub-pixel tracking
            b.el.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`
        }
    }

    openFact( spot ) {
        const fact = this.facts[ spot.factId ]
        if ( !fact ) return

        this.onHotspotOpen?.( spot )
        this._closeSheet()

        const backdrop = document.createElement( 'div' )
        backdrop.className = 'cosmos-sheet-backdrop'
        backdrop.setAttribute( 'data-interactive', '' )
        backdrop.addEventListener( 'click', () => this._closeSheet() )

        const sheet = document.createElement( 'div' )
        sheet.className = 'cosmos-sheet'
        sheet.setAttribute( 'data-interactive', '' )
        sheet.setAttribute( 'role', 'dialog' )
        sheet.setAttribute( 'aria-modal', 'true' )
        sheet.setAttribute( 'aria-label', fact.title )

        sheet.innerHTML = `
            ${ this.isMobile ? '<div class="cosmos-sheet__handle" aria-hidden="true"></div>' : '' }
            <h2 class="cosmos-sheet__title">${ fact.title }</h2>
            <p class="cosmos-sheet__body">${ fact.child }</p>
            <div class="cosmos-sheet__parent">${ fact.parent }</div>
            <button type="button" class="cosmos-btn cosmos-btn--secondary cosmos-sheet-parent-toggle" data-interactive>
                ${ icon( 'parent' ) }
                <span>告诉爸爸妈妈更多</span>
            </button>
            <button type="button" class="cosmos-btn cosmos-btn--ghost cosmos-sheet-close" data-interactive>
                ${ icon( 'close' ) }
                <span>关闭</span>
            </button>
        `

        sheet.querySelector( '.cosmos-sheet-parent-toggle' ).addEventListener( 'click', () => {
            sheet.querySelector( '.cosmos-sheet__parent' ).classList.toggle( 'is-open' )
        } )
        sheet.querySelector( '.cosmos-sheet-close' ).addEventListener( 'click', () => this._closeSheet() )

        let startY = 0
        sheet.addEventListener( 'touchstart', ( e ) => { startY = e.touches[ 0 ].clientY }, { passive: true } )
        sheet.addEventListener( 'touchend', ( e ) => {
            const dy = e.changedTouches[ 0 ].clientY - startY
            if ( dy > 80 ) this._closeSheet()
        }, { passive: true } )

        this.root.appendChild( backdrop )
        this.root.appendChild( sheet )
        this.sheet = { backdrop, sheet }
    }

    _closeSheet() {
        if ( !this.sheet ) return
        this.sheet.backdrop?.remove()
        this.sheet.sheet?.remove()
        this.sheet = null
        this.onSheetClose?.()
    }
}
