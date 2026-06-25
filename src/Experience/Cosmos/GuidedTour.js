import gsap from 'gsap'
import * as THREE from 'three'
import { icon } from './icons.js'

export default class GuidedTour {
    constructor( { root, steps, camera, controls, onComplete, reducedMotion } ) {
        this.root = root
        this.steps = steps
        this.camera = camera
        this.controls = controls
        this.onComplete = onComplete
        this.reducedMotion = reducedMotion
        this.index = 0
        this.active = false
        this.el = null
    }

    start() {
        this.active = true
        this.index = 0
        this.controls.enabled = false
        this._render()
        this._goToStep( 0 )
    }

    stop() {
        this.active = false
        this.controls.enabled = true
        this.el?.remove()
        this.el = null
    }

    _render() {
        this.el = document.createElement( 'div' )
        this.el.className = 'cosmos-tour-bar'
        this.el.setAttribute( 'data-interactive', '' )
        this.el.innerHTML = `
            <div class="cosmos-tour-bar__step"></div>
            <div class="cosmos-tour-bar__title"></div>
            <div class="cosmos-tour-bar__body"></div>
            <div class="cosmos-tour-bar__nav">
                <button type="button" class="cosmos-btn cosmos-btn--secondary cosmos-tour-prev">${ icon( 'prev' ) }<span>上一步</span></button>
                <button type="button" class="cosmos-btn cosmos-btn--primary cosmos-tour-next"><span>下一步</span>${ icon( 'next' ) }</button>
            </div>
        `
        this.root.appendChild( this.el )

        this.el.querySelector( '.cosmos-tour-prev' ).addEventListener( 'click', () => this._prev() )
        this.el.querySelector( '.cosmos-tour-next' ).addEventListener( 'click', () => this._next() )
    }

    _goToStep( i ) {
        const step = this.steps[ i ]
        if ( !step ) return

        this.el.querySelector( '.cosmos-tour-bar__step' ).textContent = `导览 ${ i + 1 } / ${ this.steps.length }`
        this.el.querySelector( '.cosmos-tour-bar__title' ).textContent = step.title
        this.el.querySelector( '.cosmos-tour-bar__body' ).textContent = step.body

        const prevBtn = this.el.querySelector( '.cosmos-tour-prev' )
        prevBtn.disabled = i === 0
        prevBtn.style.opacity = i === 0 ? '0.45' : '1'

        const nextBtn = this.el.querySelector( '.cosmos-tour-next' )
        nextBtn.querySelector( 'span' ).textContent = i === this.steps.length - 1 ? '完成' : '下一步'

        const pos = new THREE.Vector3( ...step.camera.position )
        const target = new THREE.Vector3( ...step.camera.target )

        if ( this.reducedMotion ) {
            this.camera.position.copy( pos )
            this.controls.target.copy( target )
            this.controls.update()
        } else {
            gsap.to( this.camera.position, {
                x: pos.x, y: pos.y, z: pos.z,
                duration: 1.4,
                ease: 'power2.inOut',
            } )
            gsap.to( this.controls.target, {
                x: target.x, y: target.y, z: target.z,
                duration: 1.4,
                ease: 'power2.inOut',
                onUpdate: () => this.controls.update(),
            } )
        }
    }

    _prev() {
        if ( this.index > 0 ) {
            this.index--
            this._goToStep( this.index )
        }
    }

    _next() {
        if ( this.index < this.steps.length - 1 ) {
            this.index++
            this._goToStep( this.index )
        } else {
            this.stop()
            this.onComplete?.()
        }
    }
}
