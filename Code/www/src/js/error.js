'use strict';

const WHITEBOARD_THEME = {
	light: { theme_color: '#FFF' },
	dark: { theme_color: '#333' }
};

/**
 * Main class for error page
 */
class Err {
	// Private - brief properties
	html = {};
	theme = 'dark';

	// Public - constructor
	constructor() {
		// Global events - DOM Content Loaded
		window.addEventListener('DOMContentLoaded', (event) => {
			// Link HTML elements
			const whiteboardElements = document.querySelectorAll('[id^="whiteboard-"]');
			whiteboardElements.forEach((whiteboardElement) => {
				const whiteboardElementId = whiteboardElement.getAttribute('id');
				if(whiteboardElementId.includes('-')) {
					const whiteboardElementIdParts = whiteboardElementId.split('-');
					let linkElementId = whiteboardElementIdParts[1];
					for(let i = 2; i < whiteboardElementIdParts.length; i++) {
						linkElementId += whiteboardElementIdParts[i].charAt(0).toUpperCase() + whiteboardElementIdParts[i].slice(1);
					}

					this.html[linkElementId] = whiteboardElement;
				}
			});

			// LocalStorage
			if(localStorage.getItem('theme') !== null) { this.setTheme(localStorage.getItem('theme')); }

			// Inputs
			this.html.languageSelect.value = '';
			this.html.languageSelect.onchange = (event) => {
				const url = new URL(location.href);
				url.searchParams.set('lang', event.target.value);
				location.href = url;

				event.target.value = '';
			};

			// Theme
			this.updateTheme();
		});

		// Global events - KeyDown
		window.addEventListener('keydown', (event) => {
			switch(event.code) {
				case 'KeyT': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.html.theme.click();
					}
					break;
				}
			}
		});
	}

	// Private - functions
	updateTheme() {
		if(this.updateThemeTimeout != null) {
			clearTimeout(this.updateThemeTimeout);
		}

		if(this.html.main.dataset.theme) {
			if(this.html.main.dataset.theme == 'dark') {
				this.theme = this.html.main.dataset.theme;
				this.html.main.classList.remove('s-theme--light');
				this.html.main.classList.add('s-theme--dark');
			}
			else if(this.html.main.dataset.theme == 'light') {
				this.theme = this.html.main.dataset.theme;
				this.html.main.classList.remove('s-theme--dark');
				this.html.main.classList.add('s-theme--light');
			}
			else if(this.html.main.dataset.theme == 'auto') {
				this.html.main.classList.remove('s-theme--dark');
				this.html.main.classList.remove('s-theme--light');

				const now = new Date();
				const dayStart = new Date();
				const dayEnd = new Date();

				dayStart.setHours(6, 0, 0, 0);
				dayEnd.setHours(18, 0, 0, 0);

				this.theme = 'dark';
				if(now >= dayStart && now < dayEnd) {
					this.theme = 'light';
				}
				this.html.main.classList.add('s-theme--' + this.theme);

				const timeout = (this.theme == 'dark' ? (now >= dayEnd ? dayStart.setDate(dayEnd.getDate() + 1) - now : dayStart - now) : dayEnd - now);

				this.updateThemeTimeout = setTimeout(() => {
					this.updateTheme();
				}, timeout + 1000);
			}

			document.querySelector('meta[name="theme-color"]').setAttribute('content', WHITEBOARD_THEME[this.theme].theme_color);
		}
	}

	// Public - functions
	setTheme(theme) {
		if(theme == 'dark') {
			this.html.main.dataset.theme = 'dark';
			this.html.theme.setAttribute('title', this.html.theme.dataset.themeLightTitle);
			this.html.theme.innerHTML = this.html.theme.dataset.themeLightHtml;
		}
		else if(theme == 'light') {
			this.html.main.dataset.theme = 'light';
			this.html.theme.setAttribute('title', this.html.theme.dataset.themeAutoTitle);
			this.html.theme.innerHTML = this.html.theme.dataset.themeAutoHtml;
		}
		else {
			this.html.main.dataset.theme = 'auto';
			this.html.theme.setAttribute('title', this.html.theme.dataset.themeDarkTitle);
			this.html.theme.innerHTML = this.html.theme.dataset.themeDarkHtml;
		}

		this.updateTheme();
	}
	toggleTheme() {
		if(this.html.main.dataset.theme == 'auto') { this.setTheme('dark'); }
		else if(this.html.main.dataset.theme == 'dark') { this.setTheme('light'); }
		else { this.setTheme('auto'); }

		localStorage.setItem('theme', this.html.main.dataset.theme);
	}
}

const err = new Err();