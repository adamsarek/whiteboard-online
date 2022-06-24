'use strict';

// Configuration details
const CONFIG = {
	ws: '...' // WebSocket server address
};

// Whiteboard object default properties (used in calculations with zoom)
const WHITEBOARD_OBJECT = {
	note: {
		borderRadius: 8,
		lineHeight: 1.25,
		padding: 9,
		shadowBlur: 4
	},
	image: {
		borderRadius: 8,
		shadowBlur: 4
	},
	shape: {
		shadowBlur: 4
	}
};

// Whiteboard grid default properties
const WHITEBOARD_GRID = {
	steps: [10, 50, 100]
};



// Global functions
/**
 * Send message to main thread
 * @param {String} iFn - Function name
 * @param {Array} iArgs - Function arguments
 */
function sendToClient(iFn, iArgs = []) {
	self.postMessage([iFn, iArgs]);
}

/**
 * Send message to websocket server
 * @param {String} iFn - Function name
 * @param {Array} iArgs - Function arguments
 */
function sendToServer(iFn, iArgs = []) {
	if(whiteboard.server.ws) { whiteboard.server.ws.send(JSON.stringify([iFn, iArgs])); }
}

/**
 * Connect to websocket server
 * @param {String} accessMode - Server access mode
 * @param {String} accessId - Server access id
 * @param {String} user - User trying to access
 */
function connectToServer(accessMode, accessId, user) {
	whiteboard.server.access.mode = accessMode;
	whiteboard.server.access.id = accessId;
	whiteboard.server.access.user = user;

	// Try connecting only if user can (also) reconnect
	if(whiteboard.server.reconnect) {
		whiteboard.server.ws = new WebSocket(CONFIG.ws + '?mode=' + accessMode + '&id=' + accessId + '&user=' + user);
		whiteboard.server.ws.onopen = () => {
			clearTimeout(whiteboard.server.reconnectTimeout);
		};
		whiteboard.server.ws.onclose = () => {
			whiteboard.server.ws = null;

			sendToClient('serverClose', []);

			// Try reconnecting only if user can reconnect
			if(whiteboard.server.reconnect) {
				// Wait 5s and try another connection
				whiteboard.server.reconnectTimeout = setTimeout(() => {
					connectToServer(accessMode, accessId, user);
				}, 5000);
			}
		};
		whiteboard.server.ws.onerror = () => {
			if(whiteboard.server.ws) {
				if(whiteboard.server.ws.readyState == 1) { whiteboard.server.ws.close(); }
				whiteboard.server.ws = null;
			}
		};
		whiteboard.server.ws.onmessage = (msg) => {
			const data = JSON.parse(msg.data);
			if(data.length == 2 && Array.isArray(data[1])) {
				const iFn = data[0];
				if(iFn) {
					if(whiteboard.server.fn[iFn]) {
						const iArgs = data[1];
						if(iArgs) {
							if(iArgs.length == whiteboard.server.fn[iFn].length) {
								// Requested function of right format, name and arguments found
								whiteboard.server.fn[iFn].apply({}, (iArgs.length > 0 ? iArgs : []));
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
		};
	}
}



const whiteboard = {
	// Brief properties
	grid: 'full',
	imageFetchId: 0,

	// Complex properties
	canvas: {
		grid: {
			data: [], // Calculated data

			/**
			 * Update grid canvas
			 */
			update: () => {
				// Calculate grid only if it is not turned off
				if(whiteboard.grid != 'off') {
					// Default settings
					let gridSteps = [];
					for(let i = 0; i < WHITEBOARD_GRID.steps.length; i++) {
						gridSteps[i] = Math.floor(WHITEBOARD_GRID.steps[i] * whiteboard.canvas.zoom.getLevel());
					}
					if(whiteboard.grid == 'half') {
						gridSteps = gridSteps.slice(2, 3);
					}

					// Prepare array for grid layers
					whiteboard.canvas.grid.data = new Array(gridSteps.length + 1);
					for(let i = 0; i < gridSteps.length + 1; i++) {
						whiteboard.canvas.grid.data[i] = [];
					}

					// Prepare calculation variables
					const gridLeft = whiteboard.canvas.position.x - whiteboard.canvas.size.w * 0.5;
					const gridTop = whiteboard.canvas.position.y - whiteboard.canvas.size.h * 0.5;
					const gridLineFirst = [
						gridLeft - (gridLeft % gridSteps[0]),
						gridTop - (gridTop % gridSteps[0])
					];
					const gridLineCount = [
						Math.ceil((whiteboard.canvas.size.w + gridLeft - gridLineFirst[0]) / gridSteps[0]),
						Math.ceil((whiteboard.canvas.size.h + gridTop - gridLineFirst[1]) / gridSteps[0])
					];
					const gridLineDefault = [
						whiteboard.canvas.size.w * 0.5 - whiteboard.canvas.position.x,
						whiteboard.canvas.size.h * 0.5 - whiteboard.canvas.position.y
					];

					// Fill array
					for(let i = 0; i < 2; i++) {
						for(let j = 0; j < gridLineCount[i]; j++) {
							const gridLineCheck = gridLineFirst[i] + j * gridSteps[0];

							let gridLayer = gridSteps.length;
							if(gridLineCheck != 0) {
								// Line is not in half of canvas so check right grid layer
								for(let k = gridSteps.length - 1; k >= 0; k--) {
									if(gridLineCheck % gridSteps[k] == 0) {
										gridLayer = k;
										break;
									}
								}
							}

							const gridLine = [[0, 0], [whiteboard.canvas.size.w, whiteboard.canvas.size.h]];
							gridLine[0][i] = Math.round(gridLineDefault[i] + gridLineCheck);
							gridLine[1][i] = Math.round(gridLineDefault[i] + gridLineCheck);

							whiteboard.canvas.grid.data[gridLayer].push(gridLine);
						}
					}
				}
				else {
					whiteboard.canvas.grid.data = [];
				}

				sendToClient('setGridCanvasData', [whiteboard.canvas.grid.data]);
			}
		},
		main: {
			objects: [], // Native objects
			objectTokens: [], // Used for further object identification
			data: [], // Calculated data

			/**
			 * Generate unique token
			 * @param {Number} len - Length of token
			 * @returns {String} Generated token
			 */
			getToken: (len=20) => {
				const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
				let objectToken = '';
				for(let i = 0; i < len; i++) {
					objectToken += alphabet[Math.floor(Math.random() * alphabet.length)];
				}

				// Recurse the function until it generates unique token
				if(whiteboard.canvas.main.objectTokens.indexOf(objectToken) > -1) {
					return whiteboard.canvas.main.getToken(len);
				}
				else {
					whiteboard.canvas.main.objectTokens.push(objectToken);
					return objectToken;
				}
			},

			/**
			 * Add whiteboard object
			 * @param {Object} object - Whiteboard object
			 * @returns {Object} Whiteboard object
			 */
			addObject: (object) => {
				// Generate token for further object identification
				object.token = whiteboard.canvas.main.getToken();

				// Set user to none (happens only when adding source file full of objects)
				if(!object.user) { object.user = -1; }

				whiteboard.canvas.main.objects.push(object);
				return whiteboard.canvas.main.objects[whiteboard.canvas.main.objects.length - 1];
			},

			/**
			 * Update main canvas
			 */
			update: () => {
				// Set reference point to the center of canvas
				const rX = whiteboard.canvas.size.w * 0.5 - whiteboard.canvas.position.x;
				const rY = whiteboard.canvas.size.h * 0.5 - whiteboard.canvas.position.y;

				// Clear previous data
				whiteboard.canvas.main.data = [];

				for(let i = 0; i < whiteboard.canvas.main.objects.length; i++) {
					const object = Object.assign({}, whiteboard.canvas.main.objects[i]);

					// Get object bounds
					object.vX = Math.round(rX + object.x * whiteboard.canvas.zoom.getLevel());
					object.vY = Math.round(rY + object.y * whiteboard.canvas.zoom.getLevel());
					object.vW = Math.round(object.w * whiteboard.canvas.zoom.getLevel());
					object.vH = Math.round(object.h * whiteboard.canvas.zoom.getLevel());

					// Check if object is inside of canvas
					if((object.vX < whiteboard.canvas.size.w && object.vX + object.vW >= 0) && (object.vY < whiteboard.canvas.size.h && object.vY + object.vH >= 0)) {
						switch(object.name) {
							case 'drawing': {
								object.vFX = Math.round(rX + object.fX * whiteboard.canvas.zoom.getLevel());
								object.vFY = Math.round(rY + object.fY * whiteboard.canvas.zoom.getLevel());
								object.vLineWidth = Math.round(object.lineWidth * whiteboard.canvas.zoom.getLevel());

								object.vLines = new Array(object.lines.length);
								for(let j = 0; j < object.lines.length; j++) {
									object.vLines[j] = new Array(object.lines[j].length);
									for(let k = 0; k < object.lines[j].length; k++) {
										object.vLines[j][k] = new Array(2);
										object.vLines[j][k][0] = object.vFX + Math.round(object.lines[j][k][0] * whiteboard.canvas.zoom.getLevel());
										object.vLines[j][k][1] = object.vFY + Math.round(object.lines[j][k][1] * whiteboard.canvas.zoom.getLevel());
									}
								}
								break;
							}
							case 'note': {
								object.lineHeight = WHITEBOARD_OBJECT[object.name].lineHeight;
								object.vMinW = Math.round(object.minW * whiteboard.canvas.zoom.getLevel());
								object.vMinH = Math.round(object.minH * whiteboard.canvas.zoom.getLevel());
								object.vBorderRadius = Math.round(WHITEBOARD_OBJECT[object.name].borderRadius * whiteboard.canvas.zoom.getLevel());
								object.vFontSize = Math.round(object.fontSize * whiteboard.canvas.zoom.getLevel());
								object.vPadding = Math.round(WHITEBOARD_OBJECT[object.name].padding * whiteboard.canvas.zoom.getLevel());
								object.vShadowBlur = Math.round(WHITEBOARD_OBJECT[object.name].shadowBlur * whiteboard.canvas.zoom.getLevel());
								break;
							}
							case 'image': {
								object.vBorderRadius = Math.round(WHITEBOARD_OBJECT[object.name].borderRadius * whiteboard.canvas.zoom.getLevel());
								object.vShadowBlur = Math.round(WHITEBOARD_OBJECT[object.name].shadowBlur * whiteboard.canvas.zoom.getLevel());
								break;
							}
							case 'shape': {
								object.vFX = Math.round(rX + object.fX * whiteboard.canvas.zoom.getLevel());
								object.vFY = Math.round(rY + object.fY * whiteboard.canvas.zoom.getLevel());
								object.vTX = Math.round(rX + object.tX * whiteboard.canvas.zoom.getLevel());
								object.vTY = Math.round(rY + object.tY * whiteboard.canvas.zoom.getLevel());
								object.vShadowBlur = Math.round(WHITEBOARD_OBJECT[object.name].shadowBlur * whiteboard.canvas.zoom.getLevel());
								break;
							}
						}

						object.active = 0;
						if(whiteboard.tool.object && object.id == whiteboard.tool.object.id) {
							object.active = 1;
						}

						whiteboard.canvas.main.data.push(object);
					}
				}

				sendToClient('setMainCanvasData', [whiteboard.canvas.main.data]);
			}
		},
		position: {
			x: 0,
			y: 0
		},
		size: {
			w: 0,
			h: 0
		},
		zoom: {
			levels: [
				0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00,
				1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1.80, 1.90, 2.00,
				2.10, 2.20, 2.30, 2.40, 2.50, 2.60, 2.70, 2.80, 2.90, 3.00
			],
			levelId: 7, // Default zoom level (1.00)
			level: 1,
			fromLevel: 1, // Used in pinch zooming
			custom: false, // Pinch zooming

			/**
			 * Get zoom level
			 * @returns {Number} Zoom level
			 */
			getLevel: () => {
				return (whiteboard.canvas.zoom.custom ? whiteboard.canvas.zoom.level : whiteboard.canvas.zoom.levels[whiteboard.canvas.zoom.levelId]);
			},

			/**
			 * Set zoom level
			 * @param {Number} level - Zoom level
			 * @returns {Boolean} Has zoom level changed?
			 */
			setLevel: (level) => {
				level = Math.round(level * 10) * 0.1;
				const levelChanged = whiteboard.canvas.zoom.level != level;

				if(level < whiteboard.canvas.zoom.levels[0]) {
					whiteboard.canvas.zoom.level = whiteboard.canvas.zoom.levels[0];
				}
				else if(level > whiteboard.canvas.zoom.levels[whiteboard.canvas.zoom.levels.length - 1]) {
					whiteboard.canvas.zoom.level = whiteboard.canvas.zoom.levels[whiteboard.canvas.zoom.levels.length - 1];
				}
				else {
					whiteboard.canvas.zoom.level = level;
				}
				whiteboard.canvas.zoom.custom = true;

				return levelChanged;
			},

			/**
			 * Zoom in
			 * @returns {Boolean} Has zoom level changed?
			 */
			levelUp: () => {
				if(whiteboard.canvas.zoom.custom) {
					let newLevelId = whiteboard.canvas.zoom.levels.length - 1;
					for(let i = 0; i < whiteboard.canvas.zoom.levels.length - 1; i++) {
						if(whiteboard.canvas.zoom.level <= whiteboard.canvas.zoom.levels[i]) {
							newLevelId = i;
							break;
						}
					}
					whiteboard.canvas.zoom.levelId = newLevelId;
					whiteboard.canvas.zoom.custom = false;

					return true;
				}
				else if(whiteboard.canvas.zoom.levelId < whiteboard.canvas.zoom.levels.length - 1) {
					whiteboard.canvas.zoom.levelId++;

					return true;
				}

				return false;
			},

			/**
			 * Restore zoom
			 * @returns {Boolean} Has zoom level changed?
			 */
			levelRestore: () => {
				if(whiteboard.canvas.zoom.getLevel() != 1) {
					whiteboard.canvas.zoom.levelId = whiteboard.canvas.zoom.levels.indexOf(1);
					whiteboard.canvas.zoom.custom = false;

					return true;
				}

				return false;
			},

			/**
			 * Zoom out
			 * @returns {Boolean} Has zoom level changed?
			 */
			levelDown: () => {
				if(whiteboard.canvas.zoom.custom) {
					let newLevelId = 0;
					for(let i = whiteboard.canvas.zoom.levels.length - 1; i >= 1; i--) {
						if(whiteboard.canvas.zoom.level >= whiteboard.canvas.zoom.levels[i]) {
							newLevelId = i;
							break;
						}
					}
					whiteboard.canvas.zoom.levelId = newLevelId;
					whiteboard.canvas.zoom.custom = false;

					return true;
				}
				else if(whiteboard.canvas.zoom.levelId > 0) {
					whiteboard.canvas.zoom.levelId--;

					return true;
				}

				return false;
			}
		},

		/**
		 * Set user position
		 * @param {Number} x
		 * @param {Number} y
		 * @returns {Boolean} Has user position changed?
		 */
		setPosition: (x, y) => {
			const lastPosX = whiteboard.canvas.position.x;
			const lastPosY = whiteboard.canvas.position.y;

			// Set new position
			whiteboard.canvas.position.x = x;
			whiteboard.canvas.position.y = y;

			// Limit canvas position inside whiteboard
			if(x - whiteboard.canvas.size.w * 0.5 < - whiteboard.viewport.w * 0.5) { whiteboard.canvas.position.x = - (whiteboard.viewport.w - whiteboard.canvas.size.w) * 0.5; }
			else if(x + whiteboard.canvas.size.w * 0.5 > whiteboard.viewport.w * 0.5) { whiteboard.canvas.position.x = (whiteboard.viewport.w - whiteboard.canvas.size.w) * 0.5; }
			if(y - whiteboard.canvas.size.h * 0.5 < - whiteboard.viewport.h * 0.5) { whiteboard.canvas.position.y = - (whiteboard.viewport.h - whiteboard.canvas.size.h) * 0.5; }
			else if(y + whiteboard.canvas.size.h * 0.5 > whiteboard.viewport.h * 0.5) { whiteboard.canvas.position.y = (whiteboard.viewport.h - whiteboard.canvas.size.h) * 0.5; }

			whiteboard.canvas.position.x = Math.round(whiteboard.canvas.position.x);
			whiteboard.canvas.position.y = Math.round(whiteboard.canvas.position.y);
			whiteboard.canvas.update();

			if(whiteboard.canvas.position.x != lastPosX || whiteboard.canvas.position.y != lastPosY) {
				return true;
			}
			else {
				return false;
			}
		},

		/**
		 * Update all canvases
		 */
		update: () => {
			whiteboard.canvas.grid.update();
			whiteboard.canvas.main.update();
		}
	},
	engine: {
		// Functions requested by main thread
		fn: {
			/**
			 * Client requests accessing websocket server
			 * @param {String} accessMode - Server access mode
			 * @param {String} accessId - Server access id
			 * @param {String} user - User trying to access
			 */
			access: (accessMode, accessId, user) => {
				connectToServer(accessMode, accessId, user);
			},

			/**
			 * Set whiteboard title
			 * @param {String} title - Whiteboard title
			 */
			setTitle: (title) => {
				const titleMaxLength = 128;
				if(title.length <= titleMaxLength) {
					sendToServer('setTitle', [title]);
				}
			},

			/**
			 * Window size changed
			 * @param {Number} w - Window width
			 * @param {Number} h - Window height
			 */
			setWindowSize: (w, h) => {
				whiteboard.window.w = w;
				whiteboard.window.h = h;

				if(whiteboard.updateViewport()) {
					whiteboard.engine.fn.getCanvasSize();
					whiteboard.canvas.setPosition(whiteboard.canvas.position.x, whiteboard.canvas.position.y);
				}

				// Update note <textarea> size
				if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
					whiteboard.openNote(true);
				}
			},

			/**
			 * Get canvas size
			 */
			getCanvasSize: () => {
				sendToClient('setCanvasSize', [whiteboard.canvas.size.w, whiteboard.canvas.size.h]);
			},

			/**
			 * Get canvas zoom
			 */
			getCanvasZoom: () => {
				sendToClient('setCanvasZoom', [whiteboard.canvas.zoom.getLevel()]);
			},

			/**
			 * Change zoom level
			 * @param {Number} levelChange - 1: levelUp, 0: levelRestore, -1: levelDown
			 */
			changeZoomLevel: (levelChange) => {
				const fromZoomLevel = whiteboard.canvas.zoom.getLevel();
				if(levelChange == 1 && whiteboard.canvas.zoom.levelUp()
				|| levelChange == 0 && whiteboard.canvas.zoom.levelRestore()
				|| levelChange == -1 && whiteboard.canvas.zoom.levelDown()) {
					const toZoomLevel = whiteboard.canvas.zoom.getLevel();
					const zoomLevelDiff = toZoomLevel / fromZoomLevel;

					whiteboard.updateViewport();
					whiteboard.engine.fn.getCanvasSize();
					whiteboard.engine.fn.getCanvasZoom();
					if(whiteboard.canvas.setPosition(whiteboard.canvas.position.x * zoomLevelDiff, whiteboard.canvas.position.y * zoomLevelDiff)) {
						sendToServer('setPosition', [whiteboard.canvas.position.x, whiteboard.canvas.position.y]);
					}

					// Update note <textarea> size
					if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
						whiteboard.openNote();
					}
				}
			},

			/**
			 * Pointer down event handler
			 * @param {Number} fX - From x
			 * @param {Number} fY - From y
			 */
			onPointerDown: (fX, fY) => {
				if(!whiteboard.pointer.double) {
					whiteboard.pointer.sX = Math.round(whiteboard.canvas.position.x / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.sY = Math.round(whiteboard.canvas.position.y / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.fX = Math.round((fX + whiteboard.pointer.sX * whiteboard.canvas.zoom.getLevel() - whiteboard.window.w * 0.5) / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.fY = Math.round((fY + whiteboard.pointer.sY * whiteboard.canvas.zoom.getLevel() - whiteboard.window.h * 0.5) / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.tX = whiteboard.pointer.fX;
					whiteboard.pointer.tY = whiteboard.pointer.fY;
					whiteboard.pointer.dX = 0;
					whiteboard.pointer.dY = 0;
					whiteboard.pointer.double = false;

					if(whiteboard.server.access.mode == 'edit') {
						if(whiteboard.tool.mode == 'add') {
							switch(whiteboard.tool.type) {
								case 'drawing': {
									if(whiteboard.tool.object && whiteboard.tool.object.lines) {
										whiteboard.tool.object.lines.push([[whiteboard.pointer.tX - whiteboard.tool.object.fX, whiteboard.pointer.tY - whiteboard.tool.object.fY]]);
									}
									else {
										const lineWidth = (whiteboard.tool.object ? whiteboard.tool.object.lineWidth : whiteboard.tool.lineWidth);
										whiteboard.tool.object = whiteboard.canvas.main.addObject({
											name: 'drawing',
											x: whiteboard.pointer.fX - Math.round(lineWidth * 0.5),
											y: whiteboard.pointer.fY - Math.round(lineWidth * 0.5),
											w: Math.round(lineWidth),
											h: Math.round(lineWidth),
											user: whiteboard.server.user,
											createdByUser: whiteboard.server.user,
											fX: whiteboard.pointer.fX,
											fY: whiteboard.pointer.fY,
											fill: (whiteboard.tool.object ? whiteboard.tool.object.fill : whiteboard.tool.fill),
											lineWidth: Math.round(lineWidth),
											lines: [[[0, 0]]]
										});
									}
									break;
								}
								case 'note': {
									const fontSize = (whiteboard.tool.object ? whiteboard.tool.object.fontSize : whiteboard.tool.fontSize);
									whiteboard.tool.object = whiteboard.canvas.main.addObject({
										name: 'note',
										x: whiteboard.pointer.fX,
										y: whiteboard.pointer.fY,
										w: fontSize * WHITEBOARD_OBJECT.note.lineHeight + WHITEBOARD_OBJECT.note.padding * 2,
										h: fontSize * WHITEBOARD_OBJECT.note.lineHeight + WHITEBOARD_OBJECT.note.padding * 2,
										user: whiteboard.server.user,
										createdByUser: whiteboard.server.user,
										minW: fontSize * WHITEBOARD_OBJECT.note.lineHeight + WHITEBOARD_OBJECT.note.padding * 2,
										minH: fontSize * WHITEBOARD_OBJECT.note.lineHeight + WHITEBOARD_OBJECT.note.padding * 2,
										fill: (whiteboard.tool.object ? whiteboard.tool.object.fill : whiteboard.tool.fill),
										fontSize: fontSize,
										fontFamily: (whiteboard.tool.object ? whiteboard.tool.object.fontFamily : whiteboard.tool.fontFamily),
										textAlign: (whiteboard.tool.object ? whiteboard.tool.object.textAlign : whiteboard.tool.textAlign),
										content: ''
									});
									break;
								}
								case 'image': {
									whiteboard.tool.object = whiteboard.canvas.main.addObject({
										name: 'image',
										x: whiteboard.pointer.fX,
										y: whiteboard.pointer.fY,
										w: 16,
										h: 16,
										user: whiteboard.server.user,
										createdByUser: whiteboard.server.user,
										minW: 16,
										minH: 16,
										src: (whiteboard.tool.object ? whiteboard.tool.object.src : '')
									});
									break;
								}
								case 'shape': {
									whiteboard.tool.object = whiteboard.canvas.main.addObject({
										name: 'shape',
										x: whiteboard.pointer.fX,
										y: whiteboard.pointer.fY,
										w: 0,
										h: 0,
										user: whiteboard.server.user,
										createdByUser: whiteboard.server.user,
										fX: whiteboard.pointer.fX,
										fY: whiteboard.pointer.fY,
										tX: whiteboard.pointer.tX,
										tY: whiteboard.pointer.tY,
										fill: (whiteboard.tool.object ? whiteboard.tool.object.fill : whiteboard.tool.fill),
										shapeType: (whiteboard.tool.object ? whiteboard.tool.object.shapeType : whiteboard.tool.shapeType)
									});
									break;
								}
							}
						}
						else {
							// Default action (clicked outside of objects)
							if(whiteboard.tool.type == 'note') { sendToClient('closeNote', []); }
							whiteboard.engine.fn.setTool(null, null, null);
							sendToClient('setTool', [whiteboard.tool.mode, whiteboard.tool.type, whiteboard.tool.property]);

							for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
								// Clicked inside of object
								const insideLeft = whiteboard.pointer.fX >= whiteboard.canvas.main.objects[i].x;
								const insideRight = whiteboard.pointer.fX < whiteboard.canvas.main.objects[i].x + whiteboard.canvas.main.objects[i].w;
								const insideTop = whiteboard.pointer.fY >= whiteboard.canvas.main.objects[i].y;
								const insideBottom = whiteboard.pointer.fY < whiteboard.canvas.main.objects[i].y + whiteboard.canvas.main.objects[i].h;
								const notSelected = whiteboard.canvas.main.objects[i].user == -1;
								const insideAlready = whiteboard.tool.object && whiteboard.canvas.main.objects[i].id == whiteboard.tool.object.id && whiteboard.canvas.main.objects[i].user == whiteboard.server.user;
								if(insideLeft && insideRight && insideTop && insideBottom && (notSelected || insideAlready)) {
									whiteboard.pointer.holdTimeout = setTimeout(() => {
										// Holding
										if(whiteboard.pointer.dX == 0 && whiteboard.pointer.dY == 0) {
											whiteboard.tool.mode = 'move';
											whiteboard.tool.type = whiteboard.canvas.main.objects[i].name;
											whiteboard.tool.object = whiteboard.canvas.main.objects[i];
											whiteboard.tool.object.user = whiteboard.server.user;
											sendToServer('setObjectUser', [whiteboard.tool.object.id, whiteboard.tool.object.user]);

											// Initial moving point
											whiteboard.tool.object.mX = whiteboard.tool.object.x;
											whiteboard.tool.object.mY = whiteboard.tool.object.y;
											switch(whiteboard.tool.type) {
												case 'drawing': {
													whiteboard.tool.object.mFX = whiteboard.tool.object.fX;
													whiteboard.tool.object.mFY = whiteboard.tool.object.fY;
													break;
												}
											}

											whiteboard.pointer.hold = true;
										}
									}, 100);
									break;
								}
							}
						}
					}
				}
			},

			/**
			 * Pointer up event handler
			 */
			onPointerUp: () => {
				if(whiteboard.tool.mode == 'add') {
					if(whiteboard.tool.type == 'drawing') {
						if(whiteboard.tool.object.lines.length == 1) {
							sendToServer('addObject', [whiteboard.tool.object]);
						}
						else {
							sendToServer('moveObject', [whiteboard.tool.object]);
							sendToServer('resizeObject', [whiteboard.tool.object.id, whiteboard.tool.object.w, whiteboard.tool.object.h]);
							sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'lines', whiteboard.tool.object.lines]);
						}
					}
					else {
						whiteboard.tool.mode = 'edit';

						if(whiteboard.tool.type == 'note') {
							whiteboard.tool.object.minW = whiteboard.tool.object.w;
							whiteboard.tool.object.minH = whiteboard.tool.object.h;
						}
						sendToServer('addObject', [whiteboard.tool.object]);

						sendToClient('setTool', [whiteboard.tool.mode, whiteboard.tool.type, whiteboard.tool.property]);
						whiteboard.canvas.main.update();

						// Update note <textarea> size
						if(whiteboard.tool.type == 'note') { whiteboard.openNote(true); }
					}
				}
				else {
					// Clear hold timeout
					clearTimeout(whiteboard.pointer.holdTimeout);

					// Not holding (clicked or moved)
					if(!whiteboard.pointer.hold) {
						// Clicked
						if(whiteboard.server.access.mode == 'edit' && whiteboard.pointer.dX == 0 && whiteboard.pointer.dY == 0) {
							for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
								// Clicked inside of object
								const insideLeft = whiteboard.pointer.fX >= whiteboard.canvas.main.objects[i].x;
								const insideRight = whiteboard.pointer.fX < whiteboard.canvas.main.objects[i].x + whiteboard.canvas.main.objects[i].w;
								const insideTop = whiteboard.pointer.fY >= whiteboard.canvas.main.objects[i].y;
								const insideBottom = whiteboard.pointer.fY < whiteboard.canvas.main.objects[i].y + whiteboard.canvas.main.objects[i].h;
								const notSelected = whiteboard.canvas.main.objects[i].user == -1;
								const insideAlready = whiteboard.tool.object && whiteboard.canvas.main.objects[i].id == whiteboard.tool.object.id && whiteboard.canvas.main.objects[i].user == whiteboard.server.user;
								if(insideLeft && insideRight && insideTop && insideBottom && (notSelected || insideAlready)) {
									whiteboard.tool.mode = 'edit';
									whiteboard.tool.type = whiteboard.canvas.main.objects[i].name;
									whiteboard.tool.object = whiteboard.canvas.main.objects[i];
									whiteboard.tool.object.user = whiteboard.server.user;
									sendToServer('setObjectUser', [whiteboard.tool.object.id, whiteboard.tool.object.user]);

									// Set tool
									sendToClient('setTool', [whiteboard.tool.mode, whiteboard.tool.type, whiteboard.tool.property]);
									if(whiteboard.tool.object.fill) {
										sendToClient('setFill', [whiteboard.tool.object.fill]);
									}
									if(whiteboard.tool.object.lineWidth) {
										sendToClient('setLineWidth', [whiteboard.tool.object.lineWidth]);
									}
									if(whiteboard.tool.object.shapeType) {
										sendToClient('setShapeType', [whiteboard.tool.object.shapeType]);
									}

									whiteboard.canvas.main.update();

									// Update note <textarea> content
									if(whiteboard.tool.type == 'note') { whiteboard.openNote(true); }
									break;
								}
							}
						}
						// Moved
						else if(!whiteboard.tool.mode) {
							whiteboard.canvas.update();
							sendToServer('setPosition', [whiteboard.canvas.position.x, whiteboard.canvas.position.y]);
						}
					}
					// Holding
					else {
						whiteboard.pointer.hold = false;

						if(whiteboard.tool.mode == 'move') {
							sendToServer('moveObject', [whiteboard.tool.object]);
						}

						whiteboard.tool.mode = 'edit';

						// Delete initial moving point
						delete whiteboard.tool.object.mX;
						delete whiteboard.tool.object.mY;
						if(whiteboard.tool.type == 'drawing') {
							delete whiteboard.tool.object.mFX;
							delete whiteboard.tool.object.mFY;
						}

						// Set tool
						sendToClient('setTool', [whiteboard.tool.mode, whiteboard.tool.type, whiteboard.tool.property]);
						if(whiteboard.tool.object.fill) {
							sendToClient('setFill', [whiteboard.tool.object.fill]);
						}
						if(whiteboard.tool.object.lineWidth) {
							sendToClient('setLineWidth', [whiteboard.tool.object.lineWidth]);
						}
						if(whiteboard.tool.object.shapeType) {
							sendToClient('setShapeType', [whiteboard.tool.object.shapeType]);
						}

						whiteboard.canvas.main.update();

						// Update note <textarea> position
						if(whiteboard.tool.type == 'note') { whiteboard.openNote(true); }
					}
				}
				whiteboard.pointer.double = false;
			},

			/**
			 * Pointer move event handler
			 * @param {Number} tX - To x
			 * @param {Number} tY - To y
			 */
			onPointerMove: (tX, tY) => {
				if(!whiteboard.pointer.double) {
					whiteboard.pointer.tX = Math.round((tX + whiteboard.pointer.sX * whiteboard.canvas.zoom.getLevel() - whiteboard.window.w * 0.5) / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.tY = Math.round((tY + whiteboard.pointer.sY * whiteboard.canvas.zoom.getLevel() - whiteboard.window.h * 0.5) / whiteboard.canvas.zoom.getLevel());
					whiteboard.pointer.dX = whiteboard.pointer.tX - whiteboard.pointer.fX;
					whiteboard.pointer.dY = whiteboard.pointer.tY - whiteboard.pointer.fY;

					if(whiteboard.tool.mode == 'add') {
						switch(whiteboard.tool.type) {
							case 'drawing': {
								// Change position and size of drawing according to drawn lines
								const xDiff = whiteboard.pointer.tX - whiteboard.tool.object.lineWidth * 0.5 - whiteboard.tool.object.x;
								const yDiff = whiteboard.pointer.tY - whiteboard.tool.object.lineWidth * 0.5 - whiteboard.tool.object.y;
								const wDiff = whiteboard.pointer.tX + whiteboard.tool.object.lineWidth * 0.5 - (whiteboard.tool.object.x + whiteboard.tool.object.w);
								const hDiff = whiteboard.pointer.tY + whiteboard.tool.object.lineWidth * 0.5 - (whiteboard.tool.object.y + whiteboard.tool.object.h);
								if(xDiff < 0) {
									whiteboard.tool.object.x += xDiff;
									whiteboard.tool.object.w -= xDiff;
								}
								if(yDiff < 0) {
									whiteboard.tool.object.y += yDiff;
									whiteboard.tool.object.h -= yDiff;
								}
								if(wDiff > 0) {
									whiteboard.tool.object.w += wDiff;
								}
								if(hDiff > 0) {
									whiteboard.tool.object.h += hDiff;
								}
								whiteboard.tool.object.lines[whiteboard.tool.object.lines.length - 1].push([whiteboard.pointer.tX - whiteboard.tool.object.fX, whiteboard.pointer.tY - whiteboard.tool.object.fY]);
								break;
							}
							case 'note':
							case 'image': {
								// Change position and size of note or image when creating them
								const wDiff = Math.abs(whiteboard.pointer.dX);
								const hDiff = Math.abs(whiteboard.pointer.dY);
								whiteboard.tool.object.x = whiteboard.pointer.fX;
								whiteboard.tool.object.y = whiteboard.pointer.fY;
								whiteboard.tool.object.w = whiteboard.tool.object.minW;
								whiteboard.tool.object.h = whiteboard.tool.object.minH;
								if(whiteboard.pointer.dX < 0) { whiteboard.tool.object.x = whiteboard.pointer.fX - whiteboard.tool.object.minW; }
								if(whiteboard.pointer.dY < 0) { whiteboard.tool.object.y = whiteboard.pointer.fY - whiteboard.tool.object.minH; }
								if(wDiff >= whiteboard.tool.object.minW) {
									if(whiteboard.pointer.dX < 0) { whiteboard.tool.object.x = whiteboard.pointer.fX + whiteboard.pointer.dX; }
									whiteboard.tool.object.w = wDiff;
								}
								if(hDiff >= whiteboard.tool.object.minH) {
									if(whiteboard.pointer.dY < 0) { whiteboard.tool.object.y = whiteboard.pointer.fY + whiteboard.pointer.dY; }
									whiteboard.tool.object.h = hDiff;
								}
								break;
							}
							case 'shape': {
								// Change position and size of shape when creating it
								const wDiff = Math.abs(whiteboard.pointer.dX);
								const hDiff = Math.abs(whiteboard.pointer.dY);
								whiteboard.tool.object.x = whiteboard.pointer.fX;
								whiteboard.tool.object.y = whiteboard.pointer.fY;
								whiteboard.tool.object.w = wDiff;
								whiteboard.tool.object.h = hDiff;
								whiteboard.tool.object.fX = whiteboard.pointer.fX;
								whiteboard.tool.object.fY = whiteboard.pointer.fY;
								whiteboard.tool.object.tX = whiteboard.pointer.tX;
								whiteboard.tool.object.tY = whiteboard.pointer.tY;
								if(whiteboard.pointer.dX < 0) { whiteboard.tool.object.x = whiteboard.pointer.fX + whiteboard.pointer.dX; }
								if(whiteboard.pointer.dY < 0) { whiteboard.tool.object.y = whiteboard.pointer.fY + whiteboard.pointer.dY; }
								break;
							}
						}
						whiteboard.canvas.main.update();
					}
					else {
						// Holding
						if(whiteboard.pointer.hold) {
							// Whiteboard bounds
							const minX = - whiteboard.size.w * 0.5;
							const maxX = whiteboard.size.w * 0.5;
							const minY = - whiteboard.size.h * 0.5;
							const maxY = whiteboard.size.h * 0.5;

							// Whiteboard object bounds
							const left = whiteboard.tool.object.mX + whiteboard.pointer.dX;
							const right = left + whiteboard.tool.object.w;
							const top = whiteboard.tool.object.mY + whiteboard.pointer.dY;
							const bottom = top + whiteboard.tool.object.h;

							// Limit object position inside whiteboard
							if(left < minX) { whiteboard.tool.object.x = minX; }
							else if(right > maxX) { whiteboard.tool.object.x = maxX - whiteboard.tool.object.w; }
							else { whiteboard.tool.object.x = left; }
							if(top < minY) { whiteboard.tool.object.y = minY; }
							else if(bottom > maxY) { whiteboard.tool.object.y = maxY - whiteboard.tool.object.h; }
							else { whiteboard.tool.object.y = top; }

							if(whiteboard.tool.type == 'drawing') {
								const dFX = whiteboard.tool.object.mFX + whiteboard.pointer.dX - left;
								const dFY = whiteboard.tool.object.mFY + whiteboard.pointer.dY - top;

								whiteboard.tool.object.fX = whiteboard.tool.object.x + dFX;
								whiteboard.tool.object.fY = whiteboard.tool.object.y + dFY;
							}

							sendToClient('setTool', [whiteboard.tool.mode, whiteboard.tool.type, whiteboard.tool.property]);
							whiteboard.canvas.main.update();
						}
						// Not holding
						else if(!whiteboard.tool.mode) {
							whiteboard.canvas.setPosition((whiteboard.pointer.sX - whiteboard.pointer.dX) * whiteboard.canvas.zoom.getLevel(), (whiteboard.pointer.sY - whiteboard.pointer.dY) * whiteboard.canvas.zoom.getLevel());
						}
					}
				}
			},

			/**
			 * Pointer double down event handler
			 * @param {Number} fXA - From x (pointer A)
			 * @param {Number} fYA - From y (pointer A)
			 * @param {Number} fXB - From x (pointer B)
			 * @param {Number} fYB - From y (pointer B)
			 */
			onPointerDoubleDown: (fXA, fYA, fXB, fYB) => {
				whiteboard.pointer.double = true;
				whiteboard.pointer.fD = Math.hypot(fXA - fXB, fYA - fYB);
				whiteboard.canvas.zoom.fromLevel = whiteboard.canvas.zoom.level;
			},

			/**
			 * Pointer double move event handler
			 * @param {Number} tXA - To x (pointer A)
			 * @param {Number} tYA - To y (pointer A)
			 * @param {Number} tXB - To x (pointer B)
			 * @param {Number} tYB - To y (pointer B)
			 */
			onPointerDoubleMove: (tXA, tYA, tXB, tYB) => {
				whiteboard.pointer.tD = Math.hypot(tXA - tXB, tYA - tYB);
				const fromZoomLevel = whiteboard.canvas.zoom.getLevel();
				if(whiteboard.canvas.zoom.setLevel(whiteboard.canvas.zoom.fromLevel * (whiteboard.pointer.tD / whiteboard.pointer.fD))) {
					const toZoomLevel = whiteboard.canvas.zoom.getLevel();
					const zoomLevelDiff = toZoomLevel / fromZoomLevel;

					whiteboard.updateViewport();
					whiteboard.engine.fn.getCanvasSize();
					whiteboard.engine.fn.getCanvasZoom();
					if(whiteboard.canvas.setPosition(whiteboard.canvas.position.x * zoomLevelDiff, whiteboard.canvas.position.y * zoomLevelDiff)) {
						sendToServer('setPosition', [whiteboard.canvas.position.x, whiteboard.canvas.position.y]);
					}

					// Update note <textarea> size
					if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
						whiteboard.openNote();
					}
				}
			},

			/**
			 * Set user position
			 * @param {Number} x
			 * @param {Number} y
			 */
			setPosition: (x, y) => {
				if(whiteboard.canvas.setPosition(x, y)) {
					sendToServer('setPosition', [x, y]);
				}
			},

			/**
			 * Export whiteboard
			 * @param {String} type - File type to be exported
			 */
			export: (type) => {
				let w = 0;
				let h = 0;
				let data = [];

				if(whiteboard.canvas.main.objects.length > 0) {
					// Get bounds of objects
					let minX = whiteboard.canvas.main.objects[0].x;
					let minY = whiteboard.canvas.main.objects[0].y;
					let maxX = whiteboard.canvas.main.objects[0].x + whiteboard.canvas.main.objects[0].w;
					let maxY = whiteboard.canvas.main.objects[0].y + whiteboard.canvas.main.objects[0].h;
					for(let i = 1; i < whiteboard.canvas.main.objects.length; i++) {
						if(whiteboard.canvas.main.objects[i].x < minX) { minX = whiteboard.canvas.main.objects[i].x; }
						if(whiteboard.canvas.main.objects[i].y < minY) { minY = whiteboard.canvas.main.objects[i].y; }
						if(whiteboard.canvas.main.objects[i].x + whiteboard.canvas.main.objects[i].w > maxX) { maxX = whiteboard.canvas.main.objects[i].x + whiteboard.canvas.main.objects[i].w; }
						if(whiteboard.canvas.main.objects[i].y + whiteboard.canvas.main.objects[i].h > maxY) { maxY = whiteboard.canvas.main.objects[i].y + whiteboard.canvas.main.objects[i].h; }
					}
					w = maxX - minX;
					h = maxY - minY;

					// Different export data for native and image files
					switch(type) {
						case 'json': {
							for(let i = 0; i < whiteboard.canvas.main.objects.length; i++) {
								const object = JSON.parse(JSON.stringify(whiteboard.canvas.main.objects[i]));
								object.x -= minX;
								object.y -= minY;
								delete object.token;
								delete object.user;
								switch(object.name) {
									case 'drawing': {
										object.fX -= minX;
										object.fY -= minY;
										break;
									}
									case 'shape': {
										object.fX -= minX;
										object.fY -= minY;
										object.tX -= minX;
										object.tY -= minY;
										break;
									}
								}
								data.push(object);
							}
							break;
						}
						default: {
							const posX = Math.round(minX + w * 0.5);
							const posY = Math.round(minY + h * 0.5);
							data = [[], []];

							// Grid
							if(whiteboard.grid != 'off') {
								// Default settings
								let gridSteps = [];
								for(let i = 0; i < WHITEBOARD_GRID.steps.length; i++) {
									gridSteps[i] = Math.floor(WHITEBOARD_GRID.steps[i] * whiteboard.canvas.zoom.getLevel());
								}
								if(whiteboard.grid == 'half') {
									gridSteps = gridSteps.slice(2, 3);
								}

								// Prepare array for grid layers
								data[0] = new Array(gridSteps.length + 1);
								for(let i = 0; i < gridSteps.length + 1; i++) {
									data[0][i] = [];
								}

								// Prepare calculation variables
								const gridLeft = posX - w * 0.5;
								const gridTop = posY - h * 0.5;
								const gridLineFirst = [
									gridLeft - (gridLeft % gridSteps[0]),
									gridTop - (gridTop % gridSteps[0])
								];
								const gridLineCount = [
									Math.ceil((w + gridLeft - gridLineFirst[0]) / gridSteps[0]),
									Math.ceil((h + gridTop - gridLineFirst[1]) / gridSteps[0])
								];
								const gridLineDefault = [
									w * 0.5 - posX,
									h * 0.5 - posY
								];

								// Fill array
								for(let i = 0; i < 2; i++) {
									for(let j = 0; j < gridLineCount[i]; j++) {
										const gridLineCheck = gridLineFirst[i] + j * gridSteps[0];

										let gridLayer = gridSteps.length;
										if(gridLineCheck != 0) {
											// Line is not in half of canvas so check right grid layer
											for(let k = gridSteps.length - 1; k >= 0; k--) {
												if(gridLineCheck % gridSteps[k] == 0) {
													gridLayer = k;
													break;
												}
											}
										}

										const gridLine = [[0, 0], [w, h]];
										gridLine[0][i] = Math.round(gridLineDefault[i] + gridLineCheck);
										gridLine[1][i] = Math.round(gridLineDefault[i] + gridLineCheck);

										data[0][gridLayer].push(gridLine);
									}
								}
							}

							// Objects
							for(let i = 0; i < whiteboard.canvas.main.objects.length; i++) {
								const object = JSON.parse(JSON.stringify(whiteboard.canvas.main.objects[i]));
								object.x -= minX;
								object.y -= minY;
								switch(object.name) {
									case 'drawing': {
										object.fX -= minX;
										object.fY -= minY;
										for(let j = 0; j < object.lines.length; j++) {
											for(let k = 0; k < object.lines[j].length; k++) {
												object.lines[j][k][0] += object.fX;
												object.lines[j][k][1] += object.fY;
											}
										}
										break;
									}
									case 'note': {
										object.lineHeight = WHITEBOARD_OBJECT[object.name].lineHeight;
										object.borderRadius = WHITEBOARD_OBJECT[object.name].borderRadius;
										object.padding = WHITEBOARD_OBJECT[object.name].padding;
										object.shadowBlur = WHITEBOARD_OBJECT[object.name].shadowBlur;
										break;
									}
									case 'image': {
										object.borderRadius = WHITEBOARD_OBJECT[object.name].borderRadius;
										object.shadowBlur = WHITEBOARD_OBJECT[object.name].shadowBlur;
										break;
									}
									case 'shape': {
										object.fX -= minX;
										object.fY -= minY;
										object.tX -= minX;
										object.tY -= minY;
										object.shadowBlur = WHITEBOARD_OBJECT[object.name].shadowBlur;
										break;
									}
								}
								data[1].push(object);
							}
							break;
						}
					}
				}

				sendToClient('export', [type, w, h, data]);
			},

			/**
			 * Set user tool
			 * @param {String} toolMode - Tool mode (add / edit / move)
			 * @param {String} toolType - Tool type (drawing / note / image / shape)
			 * @param {String} toolProperty - Tool property (e.g. fontSize)
			 */
			setTool: (toolMode, toolType, toolProperty) => {
				if((whiteboard.tool.mode == 'add' || whiteboard.tool.mode == 'edit') && !toolMode) {
					if(whiteboard.tool.object) {
						whiteboard.tool.object.user = -1;
						sendToServer('setObjectUser', [whiteboard.tool.object.id, whiteboard.tool.object.user]);

						// Delete object if it has no id when being deselected
						if(!whiteboard.tool.object.id) {
							for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
								if(whiteboard.canvas.main.objects[i] == whiteboard.tool.object) {
									// Remove object token from array of further identification
									const objectTokenIndex = whiteboard.canvas.main.objectTokens.indexOf(whiteboard.canvas.main.objects[i].token);
									if(objectTokenIndex > -1) { whiteboard.canvas.main.objectTokens.splice(objectTokenIndex, 1); }

									// Remove object
									whiteboard.canvas.main.objects.splice(i, 1);
									break;
								}
							}
						}
						whiteboard.canvas.main.update();

						whiteboard.tool.object = null;
					}
					if(whiteboard.tool.type == 'note') { sendToClient('closeNote', []); }
				}

				whiteboard.tool.mode = toolMode;
				whiteboard.tool.type = toolType;
				whiteboard.tool.property = toolProperty;
			},

			/**
			 * Delete whiteboard object
			 */
			deleteObject: () => {
				for(let i = 0; i < whiteboard.canvas.main.objects.length; i++) {
					if(whiteboard.canvas.main.objects[i] == whiteboard.tool.object) {
						whiteboard.tool.object.user = -1;
						if(whiteboard.tool.type == 'note') { sendToClient('closeNote', []); }

						sendToServer('deleteObject', [whiteboard.tool.object.id]);

						// Remove object token from array of further identification
						const objectTokenIndex = whiteboard.canvas.main.objectTokens.indexOf(whiteboard.tool.object.token);
						if(objectTokenIndex > -1) { whiteboard.canvas.main.objectTokens.splice(objectTokenIndex, 1); }

						// Remove object
						whiteboard.canvas.main.objects.splice(i, 1);

						whiteboard.canvas.main.update();
						break;
					}
				}
			},

			/**
			 * Set whiteboard grid
			 * @param {String} grid - Grid type
			 */
			setGrid: (grid) => {
				whiteboard.grid = grid;
				whiteboard.canvas.grid.update();
			},

			/**
			 * Edit note content and size
			 * @param {Number} w - Note width
			 * @param {Number} h - Note height
			 * @param {String} content - Note text content
			 */
			editNoteContent: (w, h, content) => {
				// Set object size by text
				whiteboard.tool.object.w = Math.round(w / whiteboard.canvas.zoom.getLevel() + WHITEBOARD_OBJECT.note.padding * 2);
				whiteboard.tool.object.h = Math.round(h / whiteboard.canvas.zoom.getLevel() + WHITEBOARD_OBJECT.note.padding * 2);

				// Always keep minimal size given since adding object
				if(whiteboard.tool.object.w < whiteboard.tool.object.minW) { whiteboard.tool.object.w = whiteboard.tool.object.minW; }
				if(whiteboard.tool.object.h < whiteboard.tool.object.minH) { whiteboard.tool.object.h = whiteboard.tool.object.minH; }

				// Each line has to be in <div> with <br> before </div> for multiple browser compatibility
				content = content.replaceAll('\r', '<br>');
				content = ('<div>' + content + '</div>')
				.replaceAll('<div><div>', '<div>')
				.replaceAll('<br>', '<br></div><div>')
				.replaceAll('<br></div><div></div>', '<br></div>')
				.replaceAll('</div></div>', '</div>');
				if(content.substr(-11) == '<div></div>') {
					content = content.slice(0, -11);
				}
				if(content == '<div><br></div>') {
					content = '';
				}

				const contentMaxLength = 2048;
				if(content.length <= contentMaxLength) {
					whiteboard.tool.object.content = content;

					whiteboard.canvas.main.update();

					sendToServer('resizeObject', [whiteboard.tool.object.id, whiteboard.tool.object.w, whiteboard.tool.object.h]);
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'content', whiteboard.tool.object.content]);
				}
			},

			/**
			 * Set whiteboard object fill color
			 * @param {String} fill
			 */
			setFill: (fill) => {
				if(whiteboard.tool.object) {
					whiteboard.tool.fill = fill;
					whiteboard.tool.object.fill = fill;
					if(whiteboard.tool.type == 'note') { sendToClient('styleNote', [whiteboard.tool.object.fill]); }
					whiteboard.canvas.main.update();
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'fill', whiteboard.tool.object.fill]);
				}
				else {
					whiteboard.tool.fill = fill;
				}
			},

			/**
			 * Set whiteboard object font family
			 * @param {String} fontFamily
			 */
			setFontFamily: (fontFamily) => {
				if(whiteboard.tool.object) {
					whiteboard.tool.fontFamily = fontFamily;
					whiteboard.tool.object.fontFamily = fontFamily;
					whiteboard.canvas.main.update();
					// Update note <textarea> style
					if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
						whiteboard.openNote();
					}
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'fontFamily', whiteboard.tool.object.fontFamily]);
				}
				else {
					whiteboard.tool.fontFamily = fontFamily;
				}
			},

			/**
			 * Set whiteboard object font size
			 * @param {Number} fontSize
			 */
			setFontSize: (fontSize) => {
				if(whiteboard.tool.object) {
					whiteboard.tool.fontSize = fontSize;
					whiteboard.tool.object.fontSize = fontSize;
					whiteboard.canvas.main.update();
					// Update note <textarea> size
					if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
						whiteboard.openNote();
					}
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'fontSize', whiteboard.tool.object.fontSize]);
				}
				else {
					whiteboard.tool.fontSize = fontSize;
				}
			},

			/**
			 * Set whiteboard object line width
			 * @param {Number} lineWidth
			 */
			setLineWidth: (lineWidth) => {
				if(whiteboard.tool.object) {
					if(whiteboard.tool.type == 'drawing') {
						// Change drawing size
						const lineWidthDiff = lineWidth - whiteboard.tool.object.lineWidth;
						whiteboard.tool.object.x -= lineWidthDiff * 0.5;
						whiteboard.tool.object.y -= lineWidthDiff * 0.5;
						whiteboard.tool.object.w += lineWidthDiff;
						whiteboard.tool.object.h += lineWidthDiff;
					}
					whiteboard.tool.lineWidth = lineWidth;
					whiteboard.tool.object.lineWidth = lineWidth;
					whiteboard.canvas.main.update();
					sendToServer('moveObject', [whiteboard.tool.object]);
					sendToServer('resizeObject', [whiteboard.tool.object.id, whiteboard.tool.object.w, whiteboard.tool.object.h]);
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'lineWidth', whiteboard.tool.object.lineWidth]);
				}
				else {
					whiteboard.tool.lineWidth = lineWidth;
				}
			},

			/**
			 * Set whiteboard object shape type
			 * @param {String} shapeType
			 */
			setShapeType: (shapeType) => {
				if(whiteboard.tool.object) {
					whiteboard.tool.shapeType = shapeType;
					whiteboard.tool.object.shapeType = shapeType;
					whiteboard.canvas.main.update();
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'shapeType', whiteboard.tool.object.shapeType]);
				}
				else {
					whiteboard.tool.shapeType = shapeType;
				}
			},

			/**
			 * Set whiteboard object text align
			 * @param {String} textAlign
			 */
			setTextAlign: (textAlign) => {
				if(whiteboard.tool.object) {
					whiteboard.tool.textAlign = textAlign;
					whiteboard.tool.object.textAlign = textAlign;
					sendToClient('setTextAlign', [textAlign]);
					whiteboard.canvas.main.update();
					// Update note <textarea> style
					if(whiteboard.tool.mode == 'edit' && whiteboard.tool.type == 'note') {
						whiteboard.openNote();
					}
					sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'textAlign', whiteboard.tool.object.textAlign]);
				}
				else {
					whiteboard.tool.textAlign = textAlign;
				}
			},

			/**
			 * Add source file
			 * @param {File} file - Source file
			 */
			addSourceFile: (file) => {
				const fileReader = new FileReader();
				fileReader.onload = () => {
					const jsonData = JSON.parse(fileReader.result);

					const x = Math.round(whiteboard.canvas.position.x / whiteboard.canvas.zoom.getLevel() - jsonData.size.w * 0.5);
					const y = Math.round(whiteboard.canvas.position.y / whiteboard.canvas.zoom.getLevel() - jsonData.size.h * 0.5);

					// Convert source file data
					for(let i = 0; i < jsonData.objects.length; i++) {
						jsonData.objects[i].x += x;
						jsonData.objects[i].y += y;

						switch(jsonData.objects[i].name) {
							case 'drawing': {
								jsonData.objects[i].fX += x;
								jsonData.objects[i].fY += y;
								break;
							}
							case 'shape': {
								jsonData.objects[i].fX += x;
								jsonData.objects[i].fY += y;
								jsonData.objects[i].tX += x;
								jsonData.objects[i].tY += y;
								break;
							}
						}

						sendToServer('addObject', [
							whiteboard.canvas.main.addObject(jsonData.objects[i])
						]);
					}
					whiteboard.canvas.main.update();
				};
				fileReader.readAsText(file);
			},

			/**
			 * Set whiteboard object image
			 * @param {File} file - Image file
			 */
			setImage: (file) => {
				const maxFileSize = 10; // MB
				if(file.size <= (maxFileSize * 1024 * 1024)) {
					whiteboard.imageFetchId++;
					const imageFetchId = whiteboard.imageFetchId;
					const formData = new FormData();
					formData.append('file', file);
					fetch('/upload.php', {
						method: 'POST',
						body: formData
					})
					.then(response => response.json())
					.then(data => {
						if(imageFetchId == whiteboard.imageFetchId) {
							if(!data.error) {
								if(whiteboard.tool.object) {
									if(whiteboard.tool.mode == 'add') {
										whiteboard.tool.object.src = data.msg;
									}
									else {
										whiteboard.tool.object.src = data.msg;
										sendToServer('editObject', [whiteboard.tool.object.id, whiteboard.tool.object.name, 'src', whiteboard.tool.object.src]);
									}
									whiteboard.canvas.main.update();
								}
								else {
									whiteboard.tool.object = { src: data.msg };
								}
							}
							else {
								throw Error(data.msg);
							}
						}
					})
					.catch(error => {
						throw Error(error);
					});

					const toolMode = (whiteboard.tool.mode ? whiteboard.tool.mode : 'add');
					whiteboard.engine.fn.setTool(toolMode, 'image', null);
					sendToClient('setTool', [toolMode, 'image', null]);
				}
				else {
					throw Error(`The image file is too big! Maximal allowed file size is ${maxFileSize} MB.`);
				}
			}
		}
	},
	pointer: {
		sX: null,
		sY: null,
		fX: null,
		fY: null,
		tX: null,
		tY: null,
		dX: null,
		dY: null,
		double: false,
		hold: false,
		holdTimeout: null,
		fD: null,
		tD: null
	},
	server: {
		ws: null,
		reconnect: true,
		reconnectTimeout: null,
		access: {
			mode: null,
			id: null,
			user: null
		},
		user: -1,
		// Functions requested by websocket server
		fn: {
			/**
			 * Set whiteboard title
			 * @param {String} title - Whiteboard title
			 */
			setTitle: (title) => {
				sendToClient('setTitle', [title]);
			},

			/**
			 * Set user position
			 * @param {Number} x
			 * @param {Number} y
			 */
			setPosition: (x, y) => {
				whiteboard.canvas.setPosition(x, y);
			},

			/**
			 * Set user id
			 * @param {Number} user - User id
			 */
			setUser: (user) => {
				whiteboard.server.user = user;
				sendToClient('setUser', [whiteboard.server.user]);
			},

			/**
			 * Set whiteboard objects
			 * @param {Array} objects - Whiteboard objects
			 */
			setObjects: (objects) => {
				whiteboard.canvas.main.objects = [];
				for(let i = 0; i < objects.length; i++) {
					whiteboard.canvas.main.addObject(objects[i]);
				}
				whiteboard.canvas.main.update();
			},

			/**
			 * Finish whiteboard loading
			 * @param {Boolean} owner - Is user owner of whiteboard?
			 */
			init: (owner) => {
				sendToClient('init', [owner]);
			},

			/**
			 * Disable quick reconnect and send user over to the error page
			 */
			noReconnect: () => {
				sendToClient('error', [403]);
				whiteboard.server.reconnect = false;
			},

			/**
			 * Try reconnect
			 */
			reconnect: () => {
				sendToClient('reconnect', []);
			},

			/**
			 * Set whiteboard object id
			 * @param {Number} objectId - Whiteboard object id
			 * @param {String} token - Whiteboard object token
			 */
			setObjectId: (objectId, token) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].token == token) {
						whiteboard.canvas.main.objects[i].id = objectId;
						sendToServer('addObjectFinish', [objectId, whiteboard.canvas.main.objects[i].name]);
						break;
					}
				}
			},

			/**
			 * Add whiteboard object
			 * @param {Object} object - Whiteboard object
			 */
			addObject: (object) => {
				whiteboard.canvas.main.addObject(object);
				whiteboard.canvas.main.update();
			},

			/**
			 * Edit whiteboard object
			 * @param {Number} objectId - Whiteboard object id
			 * @param {String} objectPropertyName - Whiteboard object property name
			 * @param {*} objectPropertyValue - Whiteboard object property value
			 */
			editObject: (objectId, objectPropertyName, objectPropertyValue) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].id == objectId) {
						whiteboard.canvas.main.objects[i][objectPropertyName] = objectPropertyValue;
						break;
					}
				}
				whiteboard.canvas.main.update();
			},

			/**
			 * Move whiteboard object
			 * @param {Object} object - Whiteboard object
			 */
			moveObject: (object) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].id == object.id) {
						whiteboard.canvas.main.objects[i].x = object.x;
						whiteboard.canvas.main.objects[i].y = object.y;
						if(object.name == 'drawing') {
							whiteboard.canvas.main.objects[i].fX = object.fX;
							whiteboard.canvas.main.objects[i].fY = object.fY;
						}
						break;
					}
				}
				whiteboard.canvas.main.update();
			},

			/**
			 * Resize whiteboard object
			 * @param {Number} objectId - Whiteboard object id
			 * @param {Number} w - Whiteboard object width
			 * @param {Number} h - Whiteboard object height
			 */
			resizeObject: (objectId, w, h) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].id == objectId) {
						whiteboard.canvas.main.objects[i].w = w;
						whiteboard.canvas.main.objects[i].h = h;
						break;
					}
				}
				whiteboard.canvas.main.update();
			},

			/**
			 * Delete whiteboard object
			 * @param {Number} objectId - Whiteboard object id
			 */
			deleteObject: (objectId) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].id == objectId) {
						whiteboard.canvas.main.objects.splice(i, 1);
						break;
					}
				}
				whiteboard.canvas.main.update();
			},

			/**
			 * Set whiteboard object user
			 * @param {Number} objectId - Whiteboard object id
			 * @param {Number} userId - User id
			 */
			setObjectUser: (objectId, userId) => {
				for(let i = whiteboard.canvas.main.objects.length - 1; i >= 0; i--) {
					if(whiteboard.canvas.main.objects[i].id == objectId) {
						whiteboard.canvas.main.objects[i].user = userId;
						break;
					}
				}
				whiteboard.canvas.main.update();
			}
		},
	},
	size: {
		// 32K (16:9) max whiteboard size
		w: 30720,
		h: 17280
	},
	tool: {
		mode: null,
		type: null,
		property: null,
		object: null,
		fill: '999',
		fontFamily: 'Arial, sans-serif',
		fontSize: 12,
		lineWidth: 8,
		shapeType: 'rectangle',
		textAlign: 'left'
	},
	viewport: {
		w: 0,
		h: 0
	},
	window: {
		w: 0,
		h: 0
	},

	// Functions
	/**
	 * Open note on client
	 * @param {Boolean} focus - Focus note after opening it
	 */
	openNote: (focus=false) => {
		// Open html note
		for(let i = 0; i < whiteboard.canvas.main.data.length; i++) {
			if(whiteboard.canvas.main.data[i].user == whiteboard.server.user) {
				sendToClient('openNote', [
					whiteboard.canvas.main.data[i].fill,
					whiteboard.canvas.main.data[i].vX + (whiteboard.window.w - whiteboard.canvas.size.w) * 0.5,
					whiteboard.canvas.main.data[i].vY + (whiteboard.window.h - whiteboard.canvas.size.h) * 0.5,
					(whiteboard.window.w - whiteboard.canvas.main.data[i].vX > whiteboard.canvas.main.data[i].vMinW ? whiteboard.canvas.main.data[i].vMinW : whiteboard.window.w - whiteboard.canvas.main.data[i].vX) - whiteboard.canvas.main.data[i].vPadding * 2,
					(whiteboard.window.h - whiteboard.canvas.main.data[i].vY > whiteboard.canvas.main.data[i].vMinH ? whiteboard.canvas.main.data[i].vMinH : whiteboard.window.h - whiteboard.canvas.main.data[i].vY) - whiteboard.canvas.main.data[i].vPadding * 2,
					whiteboard.window.w - whiteboard.canvas.main.data[i].vX - whiteboard.canvas.main.data[i].vPadding * 2,
					whiteboard.window.h - whiteboard.canvas.main.data[i].vY - whiteboard.canvas.main.data[i].vPadding * 2,
					whiteboard.canvas.main.data[i].vBorderRadius,
					whiteboard.canvas.main.data[i].fontSize,
					whiteboard.canvas.main.data[i].vFontSize,
					whiteboard.canvas.main.data[i].fontFamily,
					WHITEBOARD_OBJECT.note.lineHeight,
					whiteboard.canvas.main.data[i].vPadding,
					whiteboard.canvas.main.data[i].textAlign,
					whiteboard.canvas.main.data[i].content,
					focus
				]);
				break;
			}
		}
	},

	/**
	 * Update viewport & canvas size
	 * @returns {Boolean} Has viewport or canvas size changed?
	 */
	updateViewport: () => {
		const lastViewportW = whiteboard.viewport.w;
		const lastViewportH = whiteboard.viewport.h;
		const lastCanvasSizeW = whiteboard.canvas.size.w;
		const lastCanvasSizeH = whiteboard.canvas.size.h;

		whiteboard.viewport.w = whiteboard.size.w * whiteboard.canvas.zoom.getLevel();
		whiteboard.viewport.h = whiteboard.size.h * whiteboard.canvas.zoom.getLevel();

		whiteboard.canvas.size.w = (whiteboard.viewport.w < whiteboard.window.w ? whiteboard.viewport.w : whiteboard.window.w);
		whiteboard.canvas.size.h = (whiteboard.viewport.h < whiteboard.window.h ? whiteboard.viewport.h : whiteboard.window.h);

		if(lastViewportW != whiteboard.viewport.w || lastViewportH != whiteboard.viewport.h || lastCanvasSizeW != whiteboard.canvas.size.w || lastCanvasSizeH != whiteboard.canvas.size.h) {
			return true;
		}
		return false;
	}
};

// Apply function send from main thread
self.onmessage = (msg) => {
	if(msg.data.length == 2 && Array.isArray(msg.data[1])) {
		const iFn = msg.data[0];
		if(iFn) {
			if(whiteboard.engine.fn[iFn]) {
				const iArgs = msg.data[1];
				if(iArgs) {
					if(iArgs.length == whiteboard.engine.fn[iFn].length) {
						whiteboard.engine.fn[iFn].apply({}, (iArgs.length > 0 ? iArgs : []));
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
};