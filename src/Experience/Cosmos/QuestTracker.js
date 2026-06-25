import { icon } from './icons.js'

export default class QuestTracker {
    constructor( { root, quests } ) {
        this.root = root
        this.quests = quests
        this.done = new Set()
        this.mounted = false
        this.el = document.createElement( 'div' )
        this.el.className = 'cosmos-quest-dock'
        this.el.hidden = true
    }

    mount() {
        if ( this.mounted ) return
        this.mounted = true

        this.el.innerHTML = `
            <button type="button" class="cosmos-quest-dock__toggle" data-interactive aria-expanded="false" aria-label="展开任务列表">
                ${ icon( 'quest' ) }
                <span class="cosmos-quest-dock__label">任务</span>
                <span class="cosmos-quest-dock__count">0/${ this.quests.length }</span>
            </button>
            <div class="cosmos-quest-dock__panel" hidden data-interactive>
                ${ this.quests.map( ( q ) => `
                    <div class="cosmos-quest-dock__item" data-quest="${ q.id }">${ q.title }</div>
                ` ).join( '' ) }
            </div>
        `

        this.toggle = this.el.querySelector( '.cosmos-quest-dock__toggle' )
        this.panel = this.el.querySelector( '.cosmos-quest-dock__panel' )
        this.countEl = this.el.querySelector( '.cosmos-quest-dock__count' )

        this.toggle.addEventListener( 'click', () => this._togglePanel() )
        this.root.appendChild( this.el )
    }

    setVisible( visible ) {
        this.el.hidden = !visible
        if ( !visible ) this._closePanel()
    }

    _togglePanel() {
        const open = this.panel.hidden
        this.panel.hidden = !open
        this.toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' )
    }

    _closePanel() {
        this.panel.hidden = true
        this.toggle.setAttribute( 'aria-expanded', 'false' )
    }

    _updateCount() {
        this.countEl.textContent = `${ this.done.size }/${ this.quests.length }`
    }

    complete( questId ) {
        if ( this.done.has( questId ) ) return false
        this.done.add( questId )
        const item = this.el.querySelector( `[data-quest="${ questId }"]` )
        item?.classList.add( 'is-done' )
        if ( item ) item.insertAdjacentHTML( 'afterbegin', icon( 'check' ) + ' ' )
        this._updateCount()
        return true
    }

    allDone() {
        return this.done.size >= this.quests.length
    }
}
