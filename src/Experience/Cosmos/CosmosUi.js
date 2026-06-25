import Experience from '@experience/Experience.js'
import DeviceProfile from './DeviceProfile.js'
import DiscoveryOverlay from './DiscoveryOverlay.js'
import GuidedTour from './GuidedTour.js'
import QuestTracker from './QuestTracker.js'
import { icon } from './icons.js'

import hotspots from '../../content/hotspots.json'
import facts from '../../content/facts.json'
import tourSteps from '../../content/tour-steps.json'
import quests from '../../content/quests.json'

export default class CosmosUi {
    constructor() {
        this.experience = Experience.getInstance()
        this.device = this.experience.deviceProfile || new DeviceProfile()
        this.reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
        this.isMobile = window.matchMedia( '(max-width: 767px)' ).matches
        this.mode = 'welcome'
        this.root = document.getElementById( 'cosmos-ui' )
        this.progress = DeviceProfile.loadProgress()

        if ( new URLSearchParams( window.location.search ).has( 'tour' ) ) {
            this.autoTour = true
        }

        this._bindCamera()
        this._renderShell()
        this._wireHud()

        this.discovery = new DiscoveryOverlay( {
            root: this.root,
            hotspots,
            facts,
            isMobile: this.isMobile,
            onHotspotOpen: ( spot ) => this._onHotspot( spot ),
            onSheetClose: () => {
                if ( this.mode === 'explore' ) this._setCanvasPointer( true )
            },
        } )

        this.quests = new QuestTracker( { root: this.root, quests } )
        this.tour = new GuidedTour( {
            root: this.root,
            steps: tourSteps,
            camera: this.camera,
            controls: this.controls,
            reducedMotion: this.reducedMotion,
            onComplete: () => this._finishTour(),
        } )

        this.root.hidden = false
        this.root.classList.toggle( 'cosmos-ui--mobile', this.isMobile )
        this.root.classList.toggle( 'cosmos-ui--desktop', !this.isMobile )

        if ( this.autoTour ) {
            this._enterTour()
        }
    }

    _bindCamera() {
        const cam = this.experience.worlds?.mainWorld?.camera
        this.camera = cam?.instance
        this.controls = cam?.controls
        this.device.applyRenderer( this.experience.renderer.instance )
    }

    _renderShell() {
        this.root.innerHTML = `
            <div class="cosmos-ui__welcome" data-interactive>
                <div class="cosmos-ui__welcome-card">
                    <h1 class="cosmos-ui__title">深空探险</h1>
                    <p class="cosmos-ui__subtitle">走近黑洞，发现光、气体与引力的秘密。</p>
                    <div class="cosmos-ui__actions">
                        <button type="button" class="cosmos-btn cosmos-btn--primary" id="cosmos-start-explore">
                            ${ icon( 'explore' ) }
                            <span>自由探索</span>
                        </button>
                        <button type="button" class="cosmos-btn cosmos-btn--secondary" id="cosmos-start-tour">
                            ${ icon( 'tour' ) }
                            <span>开始导览</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="cosmos-hud" hidden>
                <div class="cosmos-hud__group">
                    <button type="button" class="cosmos-hud__btn" id="cosmos-hud-explore" aria-label="自由探索" aria-pressed="true">${ icon( 'explore' ) }</button>
                    <button type="button" class="cosmos-hud__btn" id="cosmos-hud-tour" aria-label="导览模式" aria-pressed="false">${ icon( 'tour' ) }</button>
                    <button type="button" class="cosmos-hud__btn" id="cosmos-hud-fly" aria-label="飞近行星">${ icon( 'planet' ) }</button>
                    <button type="button" class="cosmos-hud__btn" id="cosmos-hud-labels" aria-label="隐藏标签" aria-pressed="false" title="隐藏标签">${ icon( 'eyeOff' ) }</button>
                    <button type="button" class="cosmos-hud__btn" id="cosmos-hud-share" aria-label="分享进度">${ icon( 'share' ) }</button>
                </div>
            </div>
        `

        this.welcome = this.root.querySelector( '.cosmos-ui__welcome' )
        this.hud = this.root.querySelector( '.cosmos-hud' )

        this.root.querySelector( '#cosmos-start-explore' ).addEventListener( 'click', () => this._enterExplore() )
        this.root.querySelector( '#cosmos-start-tour' ).addEventListener( 'click', () => this._enterTour() )
    }

    _wireHud() {
        this.root.querySelector( '#cosmos-hud-explore' ).addEventListener( 'click', () => this._enterExplore() )
        this.root.querySelector( '#cosmos-hud-tour' ).addEventListener( 'click', () => this._enterTour() )
        this.root.querySelector( '#cosmos-hud-fly' ).addEventListener( 'click', () => this._flyToPlanet() )
        this.root.querySelector( '#cosmos-hud-labels' ).addEventListener( 'click', () => this._toggleLabels() )
        this.root.querySelector( '#cosmos-hud-share' ).addEventListener( 'click', () => this._share() )
    }

    _dismissWelcome() {
        this.root.classList.add( 'cosmos-ui--active' )
        if ( this.welcome ) {
            this.welcome.hidden = true
            this.welcome.setAttribute( 'aria-hidden', 'true' )
        }
    }

    _enterExplore() {
        this.mode = 'explore'
        this.tour.stop()
        this._dismissWelcome()
        this.hud.hidden = false
        this.controls.enabled = true
        this._setHudMode( 'explore' )
        this.discovery.mount()
        this.discovery.setVisible( true )
        if ( !this.quests.mounted ) this.quests.mount()
        this.quests.setVisible( true )
        this._setCanvasPointer( true )
    }

    _enterTour() {
        this.mode = 'tour'
        this._dismissWelcome()
        this.hud.hidden = false
        this.discovery.mount()
        this.discovery.setVisible( false )
        if ( !this.quests.mounted ) this.quests.mount()
        this.quests.setVisible( false )
        this._setHudMode( 'tour' )
        this._setCanvasPointer( false )
        this.tour.start()
    }

    _toggleLabels() {
        const btn = this.root.querySelector( '#cosmos-hud-labels' )
        const isHidden = btn.getAttribute( 'aria-pressed' ) === 'true'
        
        if ( isHidden ) {
            btn.setAttribute( 'aria-pressed', 'false' )
            btn.innerHTML = icon( 'eyeOff' )
            this.discovery.layer.style.opacity = '1'
            this.discovery.layer.style.pointerEvents = 'auto'
        } else {
            btn.setAttribute( 'aria-pressed', 'true' )
            btn.innerHTML = icon( 'eye' )
            this.discovery.layer.style.opacity = '0'
            this.discovery.layer.style.pointerEvents = 'none'
        }
    }

    _finishTour() {
        this.progress.tourComplete = true
        DeviceProfile.saveProgress( this.progress )
        this._toast( '导览完成' )
        this._enterExplore()
        if ( this.quests.allDone() ) this._shareOffer()
    }

    _onHotspot( spot ) {
        this._setCanvasPointer( false )
        for ( const q of quests ) {
            if ( q.hotspotId === spot.id ) {
                this._completeQuest( q.id )
            }
        }
        if ( this.quests.allDone() ) this._shareOffer()
    }

    _completeQuest( questId ) {
        if ( this.quests.complete( questId ) ) {
            this.progress[ `quest:${ questId }` ] = true
            DeviceProfile.saveProgress( this.progress )
        }
    }

    _flyToPlanet() {
        const planet = this.experience.worlds?.mainWorld?.planet
        if ( !planet ) return

        this.tour.stop()
        this._dismissWelcome()
        this.mode = 'explore'
        this.hud.hidden = false
        this._setHudMode( 'explore' )
        this.discovery.mount()
        this.discovery.setVisible( true )
        if ( !this.quests.mounted ) this.quests.mount()
        this.quests.setVisible( true )
        this._setCanvasPointer( false )

        planet.flyNear( () => {
            this._setCanvasPointer( true )
            this._completeQuest( 'fly-planet' )
            this._toast( '已靠近远处行星' )
            if ( this.quests.allDone() ) this._shareOffer()
        } )
    }

    _setHudMode( mode ) {
        this.root.querySelector( '#cosmos-hud-explore' ).setAttribute( 'aria-pressed', mode === 'explore' ? 'true' : 'false' )
        this.root.querySelector( '#cosmos-hud-tour' ).setAttribute( 'aria-pressed', mode === 'tour' ? 'true' : 'false' )
    }

    _setCanvasPointer( enabled ) {
        const canvas = this.experience.canvas
        if ( canvas ) canvas.style.pointerEvents = enabled ? 'auto' : 'none'
    }

    async _share() {
        const url = `${ location.origin }${ location.pathname }?tour=1`
        const payload = {
            title: '深空探险',
            text: '我在 e2n 深空科技馆完成了探险，一起来看黑洞吧。',
            url,
        }
        try {
            if ( navigator.share ) {
                await navigator.share( payload )
            } else {
                await navigator.clipboard.writeText( url )
                this._toast( '链接已复制' )
            }
        } catch {
            /* user cancelled */
        }
    }

    _shareOffer() {
        this._toast( '全部任务完成，可以分享了' )
    }

    _toast( message ) {
        const el = document.createElement( 'div' )
        el.className = 'cosmos-toast'
        el.setAttribute( 'data-interactive', '' )
        el.textContent = message
        this.root.appendChild( el )
        setTimeout( () => el.remove(), 2800 )
    }

    update( delta ) {
        const prevTier = this.device.tier
        this.device.sampleFrame( delta )
        if ( this.device.tier !== prevTier ) {
            const sf = this.experience.worlds?.mainWorld?.starfield
            if ( sf && sf.starCount !== this.device.starCount ) {
                sf.setStarCount( this.device.starCount )
            }
            this.device.applyRenderer( this.experience.renderer.instance )
        }
        
        // Synchronize 3D positions to 2D UI overlays
        if ( this.discovery && this.camera ) {
            this.discovery.update( this.camera, this.experience.worlds?.mainWorld?.planet )
        }
    }
}
