const STORAGE_KEY = 'e2n-cosmos-progress'

export default class DeviceProfile {
    constructor() {
        this.tier = this._detectTier()
        this.pixelRatioCap = { high: 2, mid: 1.5, low: 1 }[ this.tier ]
        this.starCount = { high: 300000, mid: 100000, low: 40000 }[ this.tier ]
        this._fpsSamples = []
    }

    _detectTier() {
        const mobile = window.matchMedia( '(max-width: 767px)' ).matches
        const mem = navigator.deviceMemory || 4
        const cores = navigator.hardwareConcurrency || 4

        if ( !mobile && mem >= 8 && cores >= 8 ) return 'high'
        if ( mobile || mem <= 4 ) return 'mid'
        return 'high'
    }

    applyRenderer( renderer ) {
        const cap = this.pixelRatioCap
        renderer.setPixelRatio( Math.min( window.devicePixelRatio, cap ) )
    }

    sampleFrame( delta ) {
        if ( delta <= 0 ) return
        const fps = 1 / delta
        this._fpsSamples.push( fps )
        if ( this._fpsSamples.length < 90 ) return

        const avg = this._fpsSamples.reduce( ( a, b ) => a + b, 0 ) / this._fpsSamples.length
        this._fpsSamples = []

        if ( avg < 24 && this.tier !== 'low' ) {
            this.tier = this.tier === 'high' ? 'mid' : 'low'
            this.pixelRatioCap = { high: 2, mid: 1.5, low: 1 }[ this.tier ]
            this.starCount = { high: 300000, mid: 100000, low: 40000 }[ this.tier ]
        }
    }

    static loadProgress() {
        try {
            return JSON.parse( localStorage.getItem( STORAGE_KEY ) || '{}' )
        } catch {
            return {}
        }
    }

    static saveProgress( data ) {
        localStorage.setItem( STORAGE_KEY, JSON.stringify( data ) )
    }
}
