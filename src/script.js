import './preloader.js'

async function hasWebGPU() {
    if ( !navigator.gpu ) return false
    try {
        const adapter = await navigator.gpu.requestAdapter()
        return !!adapter
    } catch {
        return false
    }
}

function showFallback() {
    const fallback = document.getElementById( 'webgpu-fallback' )
    fallback?.removeAttribute( 'hidden' )

    const canvas = document.querySelector( 'canvas.webgl' )
    if ( canvas ) canvas.style.display = 'none'

    const preloader = document.getElementById( 'preloader' )
    if ( preloader ) {
        preloader.style.display = 'none'
        preloader.style.pointerEvents = 'none'
    }

    document.getElementById( 'cosmos-ui' )?.setAttribute( 'hidden', '' )
    document.getElementById( 'debug-panel' )?.remove()
}

async function bootstrap() {
    const webgpuReady = await hasWebGPU()

    if ( !webgpuReady ) {
        showFallback()
        return
    }

    const { default: Experience } = await import( './Experience/Experience.js' )
    new Experience( document.querySelector( 'canvas.webgl' ) )
}

bootstrap()
