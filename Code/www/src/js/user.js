'use strict';

// Configuration details
const CONFIG = {
	allowed: {
		protocol: ['https'],
		hostname: ['www.whiteboard.ga'],
		mode: ['', 'user']
	}
};

const WHITEBOARD_THEME = {
	light: { theme_color: '#FFF' },
	dark: { theme_color: '#333' }
};

/**
 * Main class for user page
 */
class User {
	// Private - brief properties
	html = {};
	initialized = false;
	theme = 'dark';
	documentTitle = document.title;
	title = '';
	whiteboards = [];

	// Private - complex properties
	access = {
		allowed: CONFIG.allowed,
		current: {
			protocol: location.protocol.substr(0, location.protocol.length - 1),
			hostname: location.hostname,
			pathname: location.pathname.substr(1, location.pathname.length - 1).split('/')
		},
		mode: null,
		id: null,
		user: null,
		permit: false
	};
	server = {
		ws: null,
		reconnect: true,
		reconnectTimeout: null,
		fn: {
			init: () => {
				this.initialized = true;

				if(this.html.dashboard && this.html.overlay && this.html.loading) {
					this.html.dashboard.classList.remove('o-dashboard--hidden');
					this.html.dashboard.classList.add('o-dashboard--visible');
					this.html.overlay.classList.add('o-overlay--hidden');
					this.html.loading.classList.add('c-loading--hidden');
				}
			},
			noReconnect: () => {
				this.error(403);
				this.server.reconnect = false;
			},
			reconnect: () => {
				location.reload();
			},
			setWhiteboards: (whiteboards) => {
				this.whiteboards = whiteboards;
				if(this.html.userGrid) {
					if(this.whiteboards.length > 0) {
						this.html.userGrid.innerHTML = '';
						this.html.userGrid.classList.remove('o-user-grid--empty');
						for(let i = this.whiteboards.length - 1; i >= 0; i--) {
							this.html.userGrid.innerHTML += '<div class="o-user-grid-shelf o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-round--48 u-z-index--1" data-whiteboard-id="' + this.whiteboards[i].whiteboard_id + '">\
								<div class="o-user-grid-shelf-title o-shelf-item-text o-shelf-first-item-text u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap" contenteditable spellcheck="false" placeholder="' + this.html.userGrid.dataset.titlePlaceholder + '" title="' + this.whiteboards[i].title + '" oninput="setWhiteboardTitle(event, \'' + this.whiteboards[i].whiteboard_id + '\');">' + this.whiteboards[i].title + '</div>\
								<a class="o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" href="/edit/' + this.whiteboards[i].edit_id + '" title="' + this.html.userGrid.dataset.editTitle + '">wysiwyg</a>\
								<a class="o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" href="/view/' + this.whiteboards[i].view_id + '" title="' + this.html.userGrid.dataset.viewTitle + '">preview</a>\
								<button class="o-shelf-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" title="' + this.html.userGrid.dataset.deleteTitle + '" onclick="deleteWhiteboard(\'' + this.whiteboards[i].whiteboard_id + '\', \'' + this.whiteboards[i].title + '\');">delete</button>\
							</div>';
						}
					}
					else {
						this.html.userGrid.innerHTML = this.html.userGrid.dataset.emptyText;
						this.html.userGrid.classList.add('o-user-grid--empty');
					}
				}
			},
			addWhiteboard: (whiteboard) => {
				this.whiteboards.push(whiteboard);
				if(this.html.userGrid) {
					if(this.whiteboards.length == 1) {
						this.html.userGrid.innerHTML = '';
						this.html.userGrid.classList.remove('o-user-grid--empty');
					}
					this.html.userGrid.innerHTML = '<div class="o-user-grid-shelf o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-round--48 u-z-index--1" data-whiteboard-id="' + whiteboard.whiteboard_id + '">\
						<div class="o-user-grid-shelf-title o-shelf-item-text o-shelf-first-item-text u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap" contenteditable spellcheck="false" placeholder="' + this.html.userGrid.dataset.titlePlaceholder + '" title="' + whiteboard.title + '" oninput="setWhiteboardTitle(event, \'' + whiteboard.whiteboard_id + '\');">' + whiteboard.title + '</div>\
						<a class="o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" href="/edit/' + whiteboard.edit_id + '" title="' + this.html.userGrid.dataset.editTitle + '">wysiwyg</a>\
						<a class="o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" href="/view/' + whiteboard.view_id + '" title="' + this.html.userGrid.dataset.viewTitle + '">preview</a>\
						<button class="o-shelf-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-round--48" title="' + this.html.userGrid.dataset.deleteTitle + '" onclick="deleteWhiteboard(\'' + whiteboard.whiteboard_id + '\', \'' + whiteboard.title + '\');">delete</button>\
					</div>' + this.html.userGrid.innerHTML;
				}
			},
			deleteWhiteboard: (whiteboardId) => {
				this.deleteWhiteboard(whiteboardId);
			},
			setWhiteboardTitle: (whiteboardId, title) => {
				const shelfTitle = this.html.userGrid.querySelector('.o-user-grid-shelf[data-whiteboard-id="' + whiteboardId + '"] .o-user-grid-shelf-title');
				shelfTitle.innerText = title + '\n';
				if(title == '') { shelfTitle.innerHTML = ''; }
				shelfTitle.title = title;
			}
		}
	};

	// Public - constructor
	constructor() {
		// Global events - DOM Content Loaded
		window.addEventListener('DOMContentLoaded', (event) => {
			// Create loadings
			document.querySelectorAll('.c-loading').forEach((loading) => {
				const loadingLeft = document.createElement('div');
				const loadingRight = document.createElement('div');
				loadingLeft.className = 'c-loading-left';
				loadingRight.className = 'c-loading-right';

				const loadingLeftSemicircle = document.createElement('div');
				const loadingRightSemicircle = document.createElement('div');
				loadingLeftSemicircle.className = 'c-loading-left-semicircle';
				loadingRightSemicircle.className = 'c-loading-right-semicircle';

				loadingLeft.appendChild(loadingLeftSemicircle);
				loadingRight.appendChild(loadingRightSemicircle);
				loading.appendChild(loadingLeft);
				loading.appendChild(loadingRight);

				loading.classList.remove('c-loading--hidden');
			});

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

			if(!this.access.user) {
				setTimeout(() => {
					// Signed out
					if(!this.access.user && this.html.loading && this.html.login) {
						this.html.loading.classList.add('c-loading--hidden');
						setTimeout(() => {
							if(!this.access.user) {
								this.html.login.classList.remove('o-login--hidden');
							}
						}, 250);
					}
				}, 2000);
			}

			// Initialized
			if(this.initialized) {
				if(this.html.title) {
					this.html.title.innerHTML = this.title;
				}

				this.html.dashboard.classList.remove('o-dashboard--hidden');
				this.html.dashboard.classList.add('o-dashboard--visible');
				this.html.overlay.classList.add('o-overlay--hidden');
				this.html.loading.classList.add('c-loading--hidden');
			}

			// Inputs
			this.html.languageSelect.value = '';
			this.html.languageSelect.onchange = (event) => {
				const url = new URL(location.href);
				url.searchParams.set('lang', event.target.value);
				location.href = url;

				event.target.value = '';
			};
			this.html.userSelect.value = '';
			this.html.userSelect.onchange = (event) => {
				switch(event.target.value) {
					case 'user-account': {
						location.href = '/user';
						break;
					}
					case 'sign-out': {
						gapi.auth2.getAuthInstance().signOut()
						.then(() => {
							location.reload();
						});
						break;
					}
				}

				event.target.value = '';
			};
			this.html.userAddButton.onclick = (event) => {
				const title = prompt(event.target.dataset.addTitle);

				if(title) {
					this.sendToServer('addWhiteboard', [title.substr(0, 128)]);
				}
			};

			// Theme
			this.updateTheme();
		});

		// Global events - Online
		window.addEventListener('online', (event) => {
			// Access control
			this.accessControl();
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
	accessControl() {
		this.access.permit = false;
		if(this.access.allowed.protocol.includes(this.access.current.protocol)) {
			if(this.access.allowed.hostname.includes(this.access.current.hostname)) {
				if(this.access.allowed.mode.includes(this.access.current.pathname[0])) {
					if(this.access.user) {
						// Signed in
						if(this.html.loading && this.html.login) {
							this.html.login.classList.add('o-login--hidden');
							this.html.loading.classList.remove('c-loading--hidden');
						}

						// User mode
						this.access.mode = 'user';
						this.access.permit = true;
						this.init();
					}
					else {
						this.error(401);
						throw Error('User is not signed in!');
					}
				}
				else {
					this.error(400);
					throw Error('Invalid access mode!');
				}
			}
			else {
				this.error(400);
				throw Error('Invalid host!');
			}
		}
		else {
			this.error(400);
			throw Error('Disallowed protocol!');
		}
	}
	error(errorCode) {
		switch(errorCode) {
			case 400: {
				location.href = '/error/400';
				break;
			}
			case 401: {
				location.href = '/error/401';
				break;
			}
			case 403: {
				location.href = '/error/403';
				break;
			}
			case 404: {
				location.href = '/error/404';
				break;
			}
		}
	}
	init() {
		if(this.access.permit) { this.connectToServer(this.access.mode, this.access.user.getAuthResponse().id_token); }
	}
	connectToServer(accessMode, user) {
		if(this.server.reconnect) {
			this.server.ws = new WebSocket('wss://whiteboard-ws.herokuapp.com?mode=' + accessMode + '&user=' + user);
			this.server.ws.onopen = (event) => {
				clearTimeout(this.server.reconnectTimeout);
			};
			this.server.ws.onclose = (event) => {
				this.server.ws = null;

				this.serverClose();
				if(this.server.reconnect) {
					// Wait 5s and try another connection
					this.server.reconnectTimeout = setTimeout(() => {
						this.connectToServer(accessMode, user);
					}, 5000);
				}
			};
			this.server.ws.onerror = (event) => {
				if(this.server.ws) {
					if(this.server.ws.readyState == 1) { this.server.ws.close(); }
					this.server.ws = null;
				}
			}
			this.server.ws.onmessage = (msg) => {
				const data = JSON.parse(msg.data);
				if(data.length == 2 && Array.isArray(data[1])) {
					const iFn = data[0];
					if(iFn) {
						if(this.server.fn[iFn]) {
							const iArgs = data[1];
							if(iArgs) {
								if(iArgs.length == this.server.fn[iFn].length) {
									this.server.fn[iFn].apply({}, (iArgs.length > 0 ? iArgs : []));
								}
								else { throw Error('The requested function does not exist!'); }
							}
							else { throw Error('The request does not contain the required arguments!'); }
						}
						else { throw Error('The requested function does not exist!'); }
					}
					else { throw Error('The request does not contain the required function!'); }
				}
				else { throw Error('The request does not meet the required format!'); }
			}
		}
	}
	sendToServer(iFn, iArgs = []) {
		this.server.ws.send(JSON.stringify([iFn, iArgs]));
	}
	serverClose() {
		// Reset GUI
		if(this.html.dashboard && this.html.overlay && this.html.loading) {
			this.html.dashboard.classList.add('o-dashboard--hidden');
			this.html.dashboard.classList.remove('o-dashboard--visible');
			this.html.overlay.classList.remove('o-overlay--hidden');
			this.html.loading.classList.remove('c-loading--hidden');
		}
	}
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
		}
	}

	// Public - functions
	setUser(user) {
		this.access.user = user;

		const profile = this.access.user.getBasicProfile();
		this.html.userImage.alt = profile.getName();
		this.html.userImage.src = profile.getImageUrl();
		this.html.userSelect.title = profile.getName();
		this.html.userSelect.querySelector('optgroup').label = profile.getName();

		this.title = profile.getName();
		document.title = this.title + ' - ' + this.documentTitle;
		if(this.html.title) {
			this.html.title.innerHTML = this.title;
		}

		// Access control
		this.accessControl();
	}
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
	setWhiteboardTitle(whiteboardId, title) {
		const titleMaxLength = 128;
		if(title.length <= titleMaxLength) {
			this.sendToServer('setWhiteboardTitle', [whiteboardId, title]);
		}
	}
	deleteWhiteboard(whiteboardId) {
		for(let i = 0; i < this.whiteboards.length; i++) {
			if(this.whiteboards[i].whiteboard_id == whiteboardId) {
				this.whiteboards.splice(i, 1);
				break;
			}
		}

		const shelf = this.html.userGrid.querySelector('.o-user-grid-shelf[data-whiteboard-id="' + whiteboardId + '"]');
		shelf.remove();
		
		if(this.whiteboards.length == 0) {
			this.html.userGrid.innerHTML = this.html.userGrid.dataset.emptyText;
			this.html.userGrid.classList.add('o-user-grid--empty');
		}

		this.sendToServer('deleteWhiteboard', [whiteboardId]);
	}
}

const user = new User();

// Global functions
function onSignIn(u) {
	user.setUser(u);
}

function toggleTheme() {
	user.toggleTheme();
}

function setWhiteboardTitle(event, whiteboardId) {
	const title = event.target.textContent;
	if(title == '') { event.target.innerHTML = ''; }
	event.target.title = title;
	user.setWhiteboardTitle(whiteboardId, title);
}

function deleteWhiteboard(whiteboardId, title) {
	const del = confirm(document.getElementById('whiteboard-user-grid').dataset.deleteTitle + '?\n- ' + title);

	if(del) {
		user.deleteWhiteboard(whiteboardId);
	}
}