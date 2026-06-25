export function icon( name ) {
    const icons = {
        explore: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
        tour: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l3-8 3 5 4-10"/></svg>',
        close: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        share: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12l8-4v8l-8-4z"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 11l10-4M7 13l10 4"/></svg>',
        quest: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.4 4.8 5.4.8-3.9 3.8.9 5.3L12 15.8 7.2 17.7l.9-5.3L4.2 8.6l5.4-.8L12 3z"/></svg>',
        parent: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19a4 4 0 014-4h8a4 4 0 014 4"/><circle cx="12" cy="8" r="3"/><path d="M16 3.5a3 3 0 010 5M8 3.5a3 3 0 000 5"/></svg>',
        prev: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M14 6l-6 6 6 6"/></svg>',
        next: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M10 6l6 6-6 6"/></svg>',
        blackhole: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/></svg>',
        planet: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="11" ry="3.5"/></svg>',
        check: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12l5 5L19 7"/></svg>',
        eye: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        eyeOff: '<svg class="cosmos-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-5.06 5.94M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>'
    }
    return icons[ name ] || ''
}
