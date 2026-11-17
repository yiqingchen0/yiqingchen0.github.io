/** The full-screen navigation menu on small screens. */
import { getLenis } from './smooth-scroll';

export function initMenu(signal: AbortSignal): void {
	const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
	const panel = document.getElementById('site-menu');
	if (!toggle || !panel) return;

	const isOpen = (): boolean => toggle.getAttribute('aria-expanded') === 'true';

	const setOpen = (open: boolean): void => {
		toggle.setAttribute('aria-expanded', String(open));
		document.documentElement.classList.toggle('menu-open', open);
		// The open panel scrolls on its own (short landscape screens); a stopped
		// Lenis would otherwise cancel its wheel and touch events.
		panel.toggleAttribute('data-lenis-prevent', open);
		// Keep focus inside the menu while it covers the page.
		document.querySelectorAll('main, footer').forEach((el) => el.toggleAttribute('inert', open));
		if (open) {
			getLenis()?.stop();
		} else {
			getLenis()?.start();
		}
	};

	toggle.addEventListener('click', () => setOpen(!isOpen()), { signal });

	panel.addEventListener(
		'click',
		(event) => {
			if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
		},
		{ signal },
	);

	document.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Escape' && isOpen()) {
				setOpen(false);
				toggle.focus();
			}
		},
		{ signal },
	);

	// Close the menu if the window grows past the mobile breakpoint. This is the
	// exact complement of the CSS query, so fractional widths (browser zoom)
	// can't fall between the two.
	const wide = window.matchMedia('not all and (max-width: 760px)');
	wide.addEventListener(
		'change',
		() => {
			if (wide.matches && isOpen()) setOpen(false);
		},
		{ signal },
	);
}
