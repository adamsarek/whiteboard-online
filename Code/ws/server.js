'use strict';

// Configuration details
const CONFIG = {
	authClientId: '...', // Authentication client ID
	mysql: {      // MySQL connection details
		host:     '...',
		port:     3306,
		user:     '...',
		password: '...',
		database: '...',
		multipleStatements: true
	},
	origin: {     // Website address
		protocol: 'https',
		hostname: 'www.whiteboard.ga'
	}
};

// Packages
const {OAuth2Client} = require('google-auth-library');
const HTTP = require('http');
const MYSQL = require('mysql');
const WS = require('ws');

// Authentication
const AUTH = new OAuth2Client(CONFIG.authClientId);



// Local functions
/**
 * Generate valid ID
 * @param {Number} len - Length of ID
 * @returns {String} Generated ID
 */
function getValidId(len=10) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	let id = '';
	for(let i = 0; i < len; i++) {
		id += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return id;
}

/**
 * Check if given ID is valid
 * @param {String} id - Given ID
 * @returns {Boolean} Is ID valid?
 */
function isValidId(id) {
	const regExp = /^[A-Za-z0-9\-\_]{10}$/;
	return regExp.test(id);
}



// Functions requested by client
const fn = {
	/**
	 * Add whiteboard
	 * @param {String} title - Whiteboard title
	 */
	addWhiteboard: function(title) {
		const edit_id = getValidId();
		let view_id;
		do {
			view_id = getValidId();
		} while(edit_id == view_id); // Loop until unique view_id generated

		main.execDBQueries([
			`INSERT INTO whiteboard(edit_id, view_id, title, user_id) VALUES('${edit_id}', '${view_id}', '${title}', '${this.client.data.user}')`,
			`SELECT LAST_INSERT_ID() AS whiteboard_id LIMIT 1`
		], 'Insert [whiteboard], Select [whiteboard]')
		.then((results) => {
			// Set known variables
			results[1][0].edit_id = edit_id;
			results[1][0].view_id = view_id;
			results[1][0].title = title;

			// Add whiteboard for other users
			main.sendToMode(this.client, false, 'user', this.client.data.user, false, ['addWhiteboard', [results[1][0]]]);
		})
		.catch((error) => {
			fn.addWhiteboard(title); // Try adding whiteboard until unique edit_id & view_id generated
		});
	},

	/**
	 * Delete whiteboard
	 * @param {Number} whiteboardId - Whiteboard ID
	 */
	deleteWhiteboard: function(whiteboardId) {
		main.execDBQueries([
			`UPDATE whiteboard SET deleted = TRUE, last_update_at = NOW() WHERE user_id = '${this.client.data.user}' AND whiteboard_id = '${whiteboardId}'`
		], 'Update [whiteboard]')
		.then(() => {
			// Delete whiteboard for other users
			main.sendToMode(this.client, true, 'user', this.client.data.user, true, this.msg);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Set whiteboard title
	 * @param {Number} whiteboardId - Whiteboard ID
	 * @param {String} title - Whiteboard title
	 */
	setWhiteboardTitle: function(whiteboardId, title) {
		main.execDBQueries([
			`UPDATE whiteboard SET title = '${title}', last_update_at = NOW() WHERE whiteboard_id = '${whiteboardId}' AND user_id = '${this.client.data.user}'`
		], 'Update [whiteboard]')
		.then(() => {
			// Set whiteboard title for other users on page - User
			main.sendToMode(this.client, true, 'user', this.client.data.user, true, this.msg);

			const msg = JSON.parse(this.msg);
			msg[0] = 'setTitle';
			msg[1].shift();

			// Set whiteboard title for other users on page - Whiteboard
			main.sendToMode(this.client, true, 'whiteboard', whiteboardId, false, msg);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Set whiteboard title
	 * @param {String} title - Whiteboard title
	 */
	setTitle: function(title) {
		main.execDBQueries([
			`UPDATE whiteboard SET title = '${title}', last_update_at = NOW() WHERE whiteboard_id = '${this.client.data.whiteboard}' AND user_id = '${this.client.data.user}'`
		], 'Update [whiteboard]')
		.then(() => {
			const msg = JSON.parse(this.msg);
			msg[0] = 'setWhiteboardTitle';
			msg[1].unshift(this.client.data.whiteboard);

			// Set whiteboard title for other users on page - User
			main.sendToMode(this.client, true, 'user', this.client.data.user, false, msg);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Set whiteboard user position
	 * @param {Number} x
	 * @param {Number} y
	 */
	setPosition: function(x, y) {
		main.execDBQueries([
			`UPDATE whiteboard_user SET x = '${x}', y = '${y}', last_update_at = NOW() WHERE whiteboard_id = '${this.client.data.whiteboard}' AND user_id = '${this.client.data.user}'`
		], 'Update [whiteboard_user]')
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Begin adding whiteboard object
	 * @param {Object} object - Whiteboard object
	 */
	addObject: function(object) {
		main.execDBQueries([
			`INSERT INTO object(name, x, y, w, h, created_by_user_id, last_update_by_user_id, whiteboard_id) VALUES('${object.name}', '${object.x}', '${object.y}', '${object.w}', '${object.h}', '${object.createdByUser}', '${this.client.data.user}', '${this.client.data.whiteboard}')`,
			`SELECT LAST_INSERT_ID() AS object_id LIMIT 1`
		], 'Insert [object], Select[object]')
		.then((results) => {
			let queries = [];

			switch(object.name) {
				case 'drawing': {
					const lineArray = JSON.stringify(object.lines);
					queries.push(`INSERT INTO drawing(object_id, f_x, f_y, fill, line_width, line_array) VALUES('${results[1][0].object_id}', '${object.fX}', '${object.fY}', '${object.fill}', '${object.lineWidth}', '${lineArray}')`);
					break;
				}
				case 'note': {
					queries.push(`INSERT INTO note(object_id, min_w, min_h, fill, font_size, font_family, text_align, content) VALUES('${results[1][0].object_id}', '${object.minW}', '${object.minH}', '${object.fill}', '${object.fontSize}', '${object.fontFamily}', '${object.textAlign}', '${object.content}')`);
					break;
				}
				case 'image': {
					queries.push(`INSERT INTO image(object_id, min_w, min_h, src) VALUES('${results[1][0].object_id}', '${object.minW}', '${object.minH}', '${object.src}')`);
					break;
				}
				case 'shape': {
					queries.push(`INSERT INTO shape(object_id, f_x, f_y, t_x, t_y, fill, shape_type) VALUES('${results[1][0].object_id}', '${object.fX}', '${object.fY}', '${object.tX}', '${object.tY}', '${object.fill}', '${object.shapeType}')`);
					break;
				}
			}

			if(queries.length == 1) {
				main.execDBQueries(queries, `Insert [${object.name}]`)
				.then((res) => {
					// Set whiteboard object id for requesting user
					main.sendFn(this.client, 'setObjectId', [results[1][0].object_id, object.token] );
				})
				.catch((error) => {
					main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
				});
			}
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Finish adding whiteboard object
	 * @param {Number} objectId - Whiteboard object ID
	 * @param {String} objectName - Whiteboard object name
	 */
	addObjectFinish: function(objectId, objectName) {
		const queries = [`UPDATE object SET deleted = FALSE, last_update_at = NOW(), last_update_by_user_id = '${this.client.data.user}' WHERE object_id = '${objectId}'`];

		switch(objectName) {
			case 'drawing': {
				queries.push(`SELECT
					object.x,
					object.y,
					object.w,
					object.h,
					object.created_by_user_id AS createdByUser,
					drawing.f_x AS fX,
					drawing.f_y AS fY,
					drawing.fill AS fill,
					drawing.line_width AS lineWidth,
					drawing.line_array AS 'lines'
				FROM object
				LEFT JOIN drawing USING(object_id)
				WHERE object_id = '${objectId}' AND deleted = FALSE
				LIMIT 1`);
				break;
			}
			case 'note': {
				queries.push(`SELECT
					object.x,
					object.y,
					object.w,
					object.h,
					object.created_by_user_id AS createdByUser,
					note.fill AS fill,
					note.min_w AS minW,
					note.min_h AS minH,
					note.font_size AS fontSize,
					note.font_family AS fontFamily,
					note.text_align AS textAlign,
					note.content
				FROM object
				LEFT JOIN note USING(object_id)
				WHERE object_id = '${objectId}' AND deleted = FALSE
				LIMIT 1`);
				break;
			}
			case 'image': {
				queries.push(`SELECT
					object.x,
					object.y,
					object.w,
					object.h,
					object.created_by_user_id AS createdByUser,
					image.min_w AS minW,
					image.min_h AS minH,
					image.src
				FROM object
				LEFT JOIN image USING(object_id)
				WHERE object_id = '${objectId}' AND deleted = FALSE
				LIMIT 1`);
				break;
			}
			case 'shape': {
				queries.push(`SELECT
					object.x,
					object.y,
					object.w,
					object.h,
					object.created_by_user_id AS createdByUser,
					shape.f_x AS fX,
					shape.f_y AS fY,
					shape.fill AS fill,
					shape.t_x AS tX,
					shape.t_y AS tY,
					shape.shape_type AS shapeType
				FROM object
				LEFT JOIN shape USING(object_id)
				WHERE object_id = '${objectId}' AND deleted = FALSE
				LIMIT 1`);
				break;
			}
		}

		main.execDBQueries(queries, `Update [object], Select [object + ${objectName}]`)
		.then((results) => {
			// Set known variables
			results[1][0].id = objectId;
			results[1][0].name = objectName;

			if(results[1][0].lines) {
				results[1][0].lines = JSON.parse(results[1][0].lines);
			}

			// Add whiteboard object for other users
			main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['addObject', [results[1][0]]]);

			// Set whiteboard object user
			fn.setObjectUser.apply({ client: this.client, msg: this.msg }, [results[1][0].id, this.client.data.user]);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Edit whiteboard object
	 * @param {Number} objectId - Whiteboard object ID
	 * @param {String} objectName - Whiteboard object name
	 * @param {String} objectPropertyName - Whiteboard object property name
	 * @param {*} objectPropertyValue - Whiteboard object property value
	 */
	editObject: function(objectId, objectName, objectPropertyName, objectPropertyValue) {
		if(main.objectProperty[objectName] && main.objectProperty[objectName][objectPropertyName]) {
			const dbPropertyName = main.objectProperty[objectName][objectPropertyName];
			let dbPropertyValue = objectPropertyValue;

			if(objectPropertyName == 'lines') {
				dbPropertyValue = JSON.stringify(dbPropertyValue);
			}

			main.execDBQueries([
				`UPDATE object SET last_update_at = NOW(), last_update_by_user_id = '${this.client.data.user}' WHERE object_id = '${objectId}'`,
				`UPDATE ${objectName} SET ${dbPropertyName} = '${dbPropertyValue}' WHERE object_id = '${objectId}'`
			], `Update [object], Update [${objectName}]`)
			.then(() => {
				// Edit whiteboard object property for other users
				main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['editObject', [objectId, objectPropertyName, objectPropertyValue]]);
			})
			.catch((error) => {
				main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
			});
		}
	},

	/**
	 * Move whiteboard object
	 * @param {Object} object - Whiteboard object
	 */
	moveObject: function(object) {
		const queries = [`UPDATE object SET x = '${object.x}', y = '${object.y}', last_update_at = NOW(), last_update_by_user_id = '${this.client.data.user}' WHERE object_id = '${object.id}'`];

		switch(object.name) {
			case 'drawing': {
				queries.push(`UPDATE drawing SET f_x = '${object.fX}', f_y = '${object.fY}' WHERE object_id = '${object.id}'`);
				break;
			}
		}

		main.execDBQueries(queries, 'Update [object]' + (object.name == 'drawing' ? ', Update [drawing]' : ''))
		.then(() => {
			// Move whiteboard object to other users
			main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['moveObject', [object]]);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Resize whiteboard object
	 * @param {Number} objectId - Whiteboard object ID
	 * @param {Number} w - Whiteboard object width
	 * @param {Number} h - Whiteboard object height
	 */
	resizeObject: function(objectId, w, h) {
		main.execDBQueries([
			`UPDATE object SET w = '${w}', h = '${h}', last_update_at = NOW(), last_update_by_user_id = '${this.client.data.user}' WHERE object_id = '${objectId}'`
		], `Update [object]`)
		.then(() => {
			// Resize whiteboard object to other users
			main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['resizeObject', [objectId, w, h]]);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},

	/**
	 * Delete whiteboard object
	 * @param {Number} objectId - Whiteboard object ID
	 */
	deleteObject: function(objectId) {
		main.execDBQueries([
			`UPDATE object SET deleted = TRUE, last_update_at = NOW(), last_update_by_user_id = '${this.client.data.user}' WHERE object_id = '${objectId}'`
		], 'Update [object]')
		.then(() => {
			// Set whiteboard object user
			fn.setObjectUser.apply({ client: this.client, msg: this.msg }, [objectId, -1, false]);

			// Delete whiteboard object for other users
			main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['deleteObject', [objectId]]);
		})
		.catch((error) => {
			main.terminateClient(this.client, 1, 'database', 'Error', { data: error });
		});
	},
	
	/**
	 * Set whiteboard object user
	 * @param {Number} objectId - Whiteboard object ID
	 * @param {Number} userId - Whiteboard object user ID
	 * @param {Boolean} sendToClient - Send changes to client
	 */
	setObjectUser: function(objectId, userId, sendToClient=true) {
		if(userId == -1) {
			// Delete whiteboard object user
			delete main.data.group.whiteboard[this.client.data.whiteboard].objectUser[objectId];

			// Delete whiteboard object
			this.client.data.objects.splice(this.client.data.objects.indexOf(objectId), 1);
		}
		else {
			if(main.data.group.whiteboard[this.client.data.whiteboard].objectUser[objectId]) {
				// Delete whiteboard object user
				for(let i = 0; i < main.data.group.whiteboard[this.client.data.whiteboard].clients.length; i++) {
					if(main.data.group.whiteboard[this.client.data.whiteboard].clients[i].data.user == main.data.group.whiteboard[this.client.data.whiteboard].objectUser[objectId]) {
						main.data.group.whiteboard[this.client.data.whiteboard].clients[i].data.objects.splice(main.data.group.whiteboard[this.client.data.whiteboard].clients[i].data.objects.indexOf(objectId), 1);
						break;
					}
				}
			}

			// Add whiteboard object user
			main.data.group.whiteboard[this.client.data.whiteboard].objectUser[objectId] = userId;
			this.client.data.objects.push(objectId);
		}

		if(sendToClient) {
			// Set whiteboard object user for other users
			main.sendToMode(this.client, true, 'whiteboard', this.client.data.whiteboard, false, ['setObjectUser', [objectId, userId]]);
		}
	}
};



/**
 * Main flow of the script
 */
class Main {
	// Server settings
	protocol = process.env.PROTOCOL;
	host = process.env.HOST || process.env.HOSTNAME;
	port = process.env.PORT || 3000;

	// WebSockets
	ws = null;

	// Object properties
	objectProperty = {
		drawing: {
			fX: 'f_x',
			fY: 'f_y',
			fill: 'fill',
			lineWidth: 'line_width',
			lines: 'line_array'
		},
		image: {
			minW: 'min_w',
			minH: 'min_h',
			src: 'src'
		},
		note: {
			minW: 'min_w',
			minH: 'min_h',
			fill: 'fill',
			fontSize: 'font_size',
			fontFamily: 'font_family',
			textAlign: 'text_align',
			content: 'content'
		},
		shape: {
			fX: 'f_x',
			fY: 'f_y',
			tX: 't_x',
			tY: 't_y',
			fill: 'fill',
			shapeType: 'shape_type'
		}
	};

	// Data
	data = {
		// Lists of data
		list: {
			clients: []
		},

		// Groups of data
		group: {
			user: {},
			whiteboard: {}
		}
	};

	constructor() {
		// Start HTTP server
		const server = HTTP.createServer();
		server.listen(this.port, () => {
			this.log('server', 'Started', { address: `${this.protocol}://${this.host}:${this.port}` });

			// Create MySQL tables
			this.execDBQueries([
				`CREATE TABLE IF NOT EXISTS user (
					user_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					sub CHAR(32) NOT NULL,
					sign_up_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					last_sign_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					last_sign_out_at TIMESTAMP,
					last_update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					PRIMARY KEY(user_id),
					UNIQUE(sub)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS whiteboard (
					whiteboard_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					edit_id CHAR(10) NOT NULL,
					view_id CHAR(10) NOT NULL,
					title CHAR(128) NOT NULL,
					deleted BIT(1) NOT NULL DEFAULT FALSE,
					last_update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					user_id BIGINT(20) UNSIGNED NOT NULL,
					PRIMARY KEY(whiteboard_id),
					UNIQUE(edit_id),
					UNIQUE(view_id),
					FOREIGN KEY(user_id) REFERENCES user(user_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS whiteboard_user (
					whiteboard_user_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					x SMALLINT(6) NOT NULL DEFAULT 0,
					y SMALLINT(6) NOT NULL DEFAULT 0,
					last_update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					whiteboard_id BIGINT(20) UNSIGNED NOT NULL,
					user_id BIGINT(20) UNSIGNED NOT NULL,
					PRIMARY KEY(whiteboard_user_id),
					FOREIGN KEY(whiteboard_id) REFERENCES whiteboard(whiteboard_id),
					FOREIGN KEY(user_id) REFERENCES user(user_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS object (
					object_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					name CHAR(16) NOT NULL,
					x SMALLINT(6) NOT NULL,
					y SMALLINT(6) NOT NULL,
					w SMALLINT(6) UNSIGNED NOT NULL,
					h SMALLINT(6) UNSIGNED NOT NULL,
					deleted BIT(1) NOT NULL DEFAULT TRUE,
					last_update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					created_by_user_id BIGINT(20) UNSIGNED NOT NULL,
					last_update_by_user_id BIGINT UNSIGNED NOT NULL,
					whiteboard_id BIGINT UNSIGNED NOT NULL,
					PRIMARY KEY(object_id),
					FOREIGN KEY(created_by_user_id) REFERENCES user(user_id),
					FOREIGN KEY(last_update_by_user_id) REFERENCES user(user_id),
					FOREIGN KEY(whiteboard_id) REFERENCES whiteboard(whiteboard_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS drawing (
					object_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					f_x SMALLINT(6) NOT NULL,
					f_y SMALLINT(6) NOT NULL,
					fill CHAR(8) NOT NULL,
					line_width TINYINT(3) UNSIGNED NOT NULL,
					line_array JSON NOT NULL,
					FOREIGN KEY(object_id) REFERENCES object(object_id),
					UNIQUE(object_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS image (
					object_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					min_w SMALLINT(6) UNSIGNED NOT NULL,
					min_h SMALLINT(6) UNSIGNED NOT NULL,
					src CHAR(128) NOT NULL,
					FOREIGN KEY(object_id) REFERENCES object(object_id),
					UNIQUE(object_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS note (
					object_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					min_w SMALLINT(6) UNSIGNED NOT NULL,
					min_h SMALLINT(6) UNSIGNED NOT NULL,
					fill CHAR(8) NOT NULL,
					font_size TINYINT(3) NOT NULL,
					font_family CHAR(64) NOT NULL,
					text_align CHAR(8) NOT NULL,
					content VARCHAR(2048),
					FOREIGN KEY(object_id) REFERENCES object(object_id),
					UNIQUE(object_id)
				) ENGINE=InnoDB CHARACTER SET utf8`,
				`CREATE TABLE IF NOT EXISTS shape (
					object_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
					f_x SMALLINT(6) NOT NULL,
					f_y SMALLINT(6) NOT NULL,
					t_x SMALLINT(6) NOT NULL,
					t_y SMALLINT(6) NOT NULL,
					fill CHAR(8) NOT NULL,
					shape_type CHAR(32) NOT NULL,
					FOREIGN KEY(object_id) REFERENCES object(object_id),
					UNIQUE(object_id)
				) ENGINE=InnoDB CHARACTER SET utf8`
			], 'Create table [user], Create table [whiteboard], Create table [whiteboard_user], Create table [object], Create table [drawing], Create table [image], Create table [note], Create table [shape]')
			.then(() => {
				// Create WebSocket server
				this.ws = new WS.Server({ server }).on('connection', (ws, req) => {
					main.log('client', 'Connected', ws.data);

					// Check request origin
					const origin = new URL(req.headers.origin);
					const request = new URLSearchParams(req.url.substr(1));
					if(origin.protocol == CONFIG.origin.protocol + ':') {
						if(origin.hostname == CONFIG.origin.hostname) {
							if(request.get('mode') == 'user') {
								if(request.get('user')) {
									// Request origin is alright, checking sign in id_token
									main.accessControl(ws, req, request);
								}
								else {
									main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'User is not signed in!' });
								}
							}
							else if(request.get('mode') == 'edit' || request.get('mode') == 'view') {
								if(isValidId(request.get('id'))) {
									if(request.get('user')) {
										// Request origin is alright, checking sign in id_token
										main.accessControl(ws, req, request);
									}
									else {
										main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'User is not signed in!' });
									}
								}
								else {
									main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'Invalid access id format!' });
								}
							}
							else {
								main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'Invalid access mode!' });
							}
						}
						else {
							main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'Invalid host!' });
						}
					}
					else {
						main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'Disallowed protocol!' });
					}
				});
			});
		});
	}

	/**
	 * Add server log
	 * @param {String} type - Server log type
	 * @param {String} message - Server log message
	 * @param {Object} args - Server log arguments
	 */
	log(type, message, args={}) {
		console.log('[' + type.toUpperCase() + '] ' + message + (args && Object.keys(args).length === 0 && args.constructor === Object ? '' : ' ' + JSON.stringify(args)));
	}

	/**
	 * Execute database queries
	 * @param {Array} queries - Database queries
	 * @param {String} message - Server log message
	 * @returns {Promise<Function>} Result resolving function
	 */
	execDBQueries(queries=[], message='') {
		return new Promise((resolve) => {
			if(queries.length >= 1) {
				const connection = MYSQL.createConnection(CONFIG.mysql);
				connection.connect();
				connection.query(queries.join(`; `), (error, results) => {
					if(error) { throw error; }
					this.log('database', (message ? message : `Queries(${queries.length}) executed`), results);
					resolve(results);
				});
				connection.end();
			}
		});
	}

	/**
	 * Verify sign in id_token
	 * @param {String} user - User
	 * @param {Object} ws - WebSocket client
	 * @param {Object} req - Request data
	 * @param {Object} request - URLSearchParams of request data
	 */
	async verify(user, ws, req, request) {
		const ticket = await AUTH.verifyIdToken({
			idToken: user,
			audience: CONFIG.authClientId
		});
		const payload = ticket.getPayload();
		const sub = payload['sub'];

		// Access granted
		main.access(ws, req, request, sub);
	}

	/**
	 * Wrapping function for verifying sign in id_token
	 * @param {Object} ws - WebSocket client
	 * @param {Object} req - Request data
	 * @param {Object} request - URLSearchParams of request data
	 */
	accessControl(ws, req, request) {
		// Check sign in id_token sent by WebSockets
		main.verify(request.get('user'), ws, req, request)
		.catch(() => {
			main.terminateClient(ws, 2, 'server', 'Access denied', { reason: 'User does not exist' });
		});
	}

	/**
	 * Access to client messaging
	 * @param {Object} ws - WebSocket client
	 * @param {Object} req - Request data
	 * @param {Object} request - URLSearchParams of request data
	 * @param {String} sub - Google account unique ID
	 */
	access(ws, req, request, sub) {
		const queries = [
			`INSERT IGNORE INTO user(sub) VALUES('${sub}')`,
			`UPDATE user SET last_sign_in_at = NOW(), last_update_at = NOW() WHERE sub = '${sub}'`,
			`SELECT user_id FROM user WHERE sub = '${sub}' LIMIT 1`
		];
		if(request.get('mode') == 'edit' || request.get('mode') == 'view') {
			queries.push(`SELECT whiteboard_id, user_id FROM whiteboard WHERE ${request.get('mode')}_id = '${request.get('id')}' AND deleted = FALSE LIMIT 1`);
		}

		main.execDBQueries(queries, 'Insert [user], Update [user], Select [user]')
		.then((results) => {
			let error = false;

			// Set alive state
			ws.isAlive = true;
			main.resetKeepAliveInterval(ws);

			// Set client access data
			ws.access = {
				mode: request.get('mode'),
				user: request.get('user')
			};
			if(request.has('id')) { ws.access.id = request.get('id'); }

			// Set client data
			ws.data = {
				ip: req.socket.remoteAddress,
				user: results[2][0].user_id
			};

			const args = {};
			if(results[3]) {
				// Check if whiteboard exists
				if(results[3].length != 1) {
					error = true;
					main.terminateClient(ws, 0, 'client', 'Access denied', { reason: 'Whiteboard of given id does not exist' });
				}
				else {
					ws.data.whiteboard = results[3][0].whiteboard_id;
					ws.data.objects = [];
					args.ownerUserId = results[3][0].user_id;
				}
			}

			// WebSocket listeners
			ws.on('close', () => {
				main.clearKeepAliveInterval(ws);
				main.deleteClient(ws);

				main.log('client', 'Disconnected', ws.data);

				main.execDBQueries([
					`UPDATE user SET last_sign_out_at = NOW(), last_update_at = NOW() WHERE user_id = '${ws.data.user}'`
				], 'Update [user]')
				.catch((error) => {
					main.terminateClient(ws, 1, 'database', 'Error', { data: error });
				});
			});
			ws.on('pong', () => {
				// Set alive state
				ws.isAlive = true;

				main.log('client', 'Pong', ws.data);
			});
			ws.on('message', (msg) => {
				if(ws.readyState == WS.OPEN) {
					let msgJSON = null;
					let msgJSONValid = false;

					// Check for valid JSON
					try {
						msgJSON = JSON.parse(msg);

						if(msgJSON && typeof msgJSON === 'object' && msgJSON !== null) {
							msgJSONValid = true;
						}
					} catch(err) {
						main.log('client', 'Message is not valid JSON', { error: err });
					}

					if(msgJSONValid) {
						if(msgJSON.length == 2 && Array.isArray(msgJSON[1])) {
							const iFn = msgJSON[0];
							if(iFn) {
								if(fn[iFn]) {
									const iArgs = msgJSON[1];
									if(iArgs) {
										if(iArgs.length == fn[iFn].length) {
											main.resetKeepAliveInterval(ws);

											main.log('client', 'Message', { message: msg, client: ws.data });

											// Apply function
											fn[iFn].apply({ client: ws, msg: msg }, iArgs);
										}
										else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The requested function does not exist!' }); }
									}
									else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The request does not contain the required arguments!' }); }
								}
								else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The requested function does not exist!' }); }
							}
							else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The request does not contain the required function!' }); }
						}
						else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The request does not meet the required format!' }); }
					}
					else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The request does not come in valid JSON format!' }); }
				}
				else { main.terminateClient(ws, 0, 'websocket', 'Message denied', { reason: 'The request has been received under unexpected condition!' }); }
			});

			// Initialize client messaging
			if(!error) { main.init(ws, args); }
		})
		.catch((error) => {
			main.terminateClient(ws, 1, 'database', 'Error', { data: error });
		});
	}

	/**
	 * Sending initial data to client
	 * @param {Object} ws - WebSocket client
	 * @param {Object} args - Client arguments
	 */
	init(ws, args) {
		main.addClient(ws, args);

		main.log('client', 'Joined', ws.data);

		switch(ws.access.mode) {
			case 'user': {
				main.execDBQueries([
					`SELECT whiteboard_id, edit_id, view_id, title FROM whiteboard WHERE user_id = '${ws.data.user}' AND deleted = FALSE`
				], 'Select [whiteboard]')
				.then((results) => {
					// Send initial data
					main.sendFn(ws, 'setWhiteboards', [results]);
					main.sendFn(ws, 'init', []);
				})
				.catch((error) => {
					main.terminateClient(ws, 1, 'database', 'Error', { data: error });
				});
				break;
			}
			case 'edit':
			case 'view': {
				main.execDBQueries([
					`INSERT INTO whiteboard_user(whiteboard_id, user_id) SELECT '${ws.data.whiteboard}', '${ws.data.user}' FROM DUAL WHERE NOT EXISTS(SELECT whiteboard_id, user_id FROM whiteboard_user WHERE whiteboard_id = '${ws.data.whiteboard}' AND user_id = '${ws.data.user}' LIMIT 1)`,
					`SELECT title, user_id FROM whiteboard WHERE whiteboard_id = '${ws.data.whiteboard}' AND deleted = FALSE LIMIT 1`,
					`SELECT x, y FROM whiteboard_user WHERE whiteboard_id = '${ws.data.whiteboard}' AND user_id = '${ws.data.user}' LIMIT 1`,
					`SELECT
						object.object_id AS id,
						object.name,
						object.x,
						object.y,
						object.w,
						object.h,
						object.created_by_user_id AS createdByUser,
						COALESCE(drawing.f_x, shape.f_x, NULL) AS fX,
						COALESCE(drawing.f_y, shape.f_y, NULL) AS fY,
						COALESCE(drawing.fill, note.fill, shape.fill, NULL) AS fill,
						drawing.line_width AS lineWidth,
						drawing.line_array AS 'lines',
						COALESCE(note.min_w, image.min_w, NULL) AS minW,
						COALESCE(note.min_h, image.min_h, NULL) AS minH,
						note.font_size AS fontSize,
						note.font_family AS fontFamily,
						note.text_align AS textAlign,
						note.content,
						image.src,
						shape.t_x AS tX,
						shape.t_y AS tY,
						shape.shape_type AS shapeType
					FROM object
					LEFT JOIN drawing USING(object_id)
					LEFT JOIN note USING(object_id)
					LEFT JOIN image USING(object_id)
					LEFT JOIN shape USING(object_id)
					WHERE whiteboard_id = '${ws.data.whiteboard}' AND deleted = FALSE
					ORDER BY id`
				], 'Insert [whiteboard_user], Select [whiteboard], Select [whiteboard_user], Select [object + drawing + note + image + shape]')
				.then((results) => {
					for(let i = 0; i < results[3].length; i++) {
						// Remove empty properties returned from database
						for(let propName in results[3][i]) {
							if(results[3][i][propName] === null || results[3][i][propName] === undefined) {
								delete results[3][i][propName];
							}
						}

						if(results[3][i].lines) {
							results[3][i].lines = JSON.parse(results[3][i].lines);
						}

						// Set whiteboard object user
						results[3][i].user = -1;
						if(main.data.group.whiteboard[ws.data.whiteboard].objectUser[results[3][i].id]) {
							results[3][i].user = main.data.group.whiteboard[ws.data.whiteboard].objectUser[results[3][i].id];
						}
					}

					// Send initial data
					main.sendFn(ws, 'setTitle', [results[1][0].title]);
					main.sendFn(ws, 'setPosition', [results[2][0].x, results[2][0].y]);
					main.sendFn(ws, 'setUser', [ws.data.user]);
					main.sendFn(ws, 'setObjects', [results[3]]);
					main.sendFn(ws, 'init', [ws.access.mode == 'edit' && results[1][0].user_id == ws.data.user]);
				})
				.catch((error) => {
					main.terminateClient(ws, 1, 'database', 'Error', { data: error });
				});
				break;
			}
		}
	}

	/**
	 * Add client to temporary server variables (list and group)
	 * @param {Object} ws - WebSocket client
	 * @param {Object} args - Client arguments
	 */
	addClient(ws, args={}) {
		// Add client to list
		main.data.list.clients.push(ws);

		switch(ws.access.mode) {
			case 'user': {
				if(!main.data.group.user[ws.data.user]) {
					// Add new page to group
					main.data.group.user[ws.data.user] = {
						clients: []
					};
				}

				// Add new client to page
				main.data.group.user[ws.data.user].clients.push(ws);
				break;
			}
			case 'edit':
			case 'view': {
				if(!main.data.group.whiteboard[ws.data.whiteboard]) {
					// Add new page to group
					main.data.group.whiteboard[ws.data.whiteboard] = {
						clients: [],
						objectUser: {},
						ownerUserId: args.ownerUserId
					};
				}

				// Add new client to page
				main.data.group.whiteboard[ws.data.whiteboard].clients.push(ws);
				break;
			}
		}
	}

	/**
	 * Delete client from temporary server variables (list and group)
	 * @param {Object} ws - WebSocket client
	 */
	deleteClient(ws) {
		for(let i = 0; i < main.data.list.clients.length; i++) {
			if(main.data.list.clients[i] == ws) {
				// Delete client from list
				main.data.list.clients.splice(i, 1);
				break;
			}
		}

		switch(ws.access.mode) {
			case 'user': {
				if(main.data.group.user[ws.data.user]) {
					for(let i = 0; i < main.data.group.user[ws.data.user].clients.length; i++) {
						if(main.data.group.user[ws.data.user].clients[i] == ws) {
							// Delete client from group
							main.data.group.user[ws.data.user].clients.splice(i, 1);

							// Delete group if it has no clients
							if(main.data.group.user[ws.data.user].clients.length == 0) {
								delete main.data.group.user[ws.data.user];
							}
							break;
						}
					}
				}
				break;
			}
			case 'edit':
			case 'view': {
				if(main.data.group.whiteboard[ws.data.whiteboard]) {
					for(let i = 0; i < main.data.group.whiteboard[ws.data.whiteboard].clients.length; i++) {
						if(main.data.group.whiteboard[ws.data.whiteboard].clients[i] == ws) {
							// Delete client from group
							main.data.group.whiteboard[ws.data.whiteboard].clients.splice(i, 1);

							// Delete whiteboard object user
							for(let j = 0; j < ws.data.objects.length; j++) {
								fn.setObjectUser.apply({ client: ws }, [ws.data.objects[j], -1]);
							}

							// Delete group if it has no clients
							if(main.data.group.whiteboard[ws.data.whiteboard].clients.length == 0) {
								delete main.data.group.whiteboard[ws.data.whiteboard];
							}
							break;
						}
					}
				}
				break;
			}
		}
	}

	/**
	 * Terminate or close WebSocket client under certain circumstances
	 * @param {Object} ws - WebSocket client
	 * @param {Number} closeOption - Determines what will happen when connection is closed
	 * @param {String} type - Server log type
	 * @param {String} message - Server log message
	 * @param {Object} args - Server log arguments
	 */
	terminateClient(ws, closeOption, type, message, args={}) {
		main.clearKeepAliveInterval(ws);

		this.log(type, message, args);
		this.log('client', 'Terminated', ws.data);

		switch(closeOption) {
			case 1: {
				// Terminate client (no waiting for buffered messages)
				ws.terminate();
				break;
			}
			case 2: {
				// Close client (allow reconnect)
				this.sendFn(ws, 'reconnect', []);
				ws.close();
				break;
			}
			default: {
				// Close client (disallow reconnect)
				this.sendFn(ws, 'noReconnect', []);
				ws.close();
				break;
			}
		}
	}

	/**
	 * Clear keepAlive interval
	 * @param {Object} ws - WebSocket client
	 */
	clearKeepAliveInterval(ws) {
		if(ws.keepAliveInterval) { clearInterval(ws.keepAliveInterval); }
		ws.isAlive = false;
	}

	/**
	 * Reset keepAlive interval
	 * @param {Object} ws - WebSocket client
	 */
	resetKeepAliveInterval(ws) {
		if(ws.keepAliveInterval) { clearInterval(ws.keepAliveInterval); }
		ws.isAlive = true;
		ws.keepAliveInterval = setInterval(() => {
			main.keepAlive(ws);
		}, 45000);
	}

	/**
	 * Keep WebSocket client alive
	 * @param {Object} ws - WebSocket client
	 */
	keepAlive(ws) {
		if(ws.readyState == WS.OPEN) {
			// Set alive state
			ws.isAlive = false;

			// Send ping request
			ws.ping();
			main.log('server', 'Ping', ws.data);

			// Pong response latency timeout (max. 10s)
			setTimeout(() => {
				if(ws.isAlive === false) {
					main.terminateClient(ws, 1, 'server', 'Pong did not reach server within given timeout limit (10s)', ws.data);
				}
			}, 10000);
		}
	}

	/**
	 * Send JSON message to client
	 * @param {Object} ws - WebSocket client
	 * @param {String} msg - Server JSON message
	 */
	sendJSON(ws, msg) {
		ws.send(msg);
	}

	/**
	 * Send message to client
	 * @param {Object} ws - WebSocket client
	 * @param {Object} msg - Server message
	 */
	send(ws, msg) {
		main.sendJSON(ws, JSON.stringify(msg));
	}

	/**
	 * Send function to client
	 * @param {Object} ws - WebSocket client
	 * @param {String} fn - Server function
	 * @param {Array} args - Server function arguments
	 */
	sendFn(ws, fn, args=[]) {
		main.send(ws, [fn, args]);
	}

	/**
	 * Send message to clients of given group
	 * @param {Object} ws - WebSocket client
	 * @param {Boolean} exclude - Exclude current client from list of recipients
	 * @param {Object} group - Given group of clients
	 * @param {Number} id - Group ID
	 * @param {Boolean} isJSON - Says whether the message is in JSON format
	 * @param {String} msg - Server message
	 */
	sendToMode(ws, exclude, group, id, isJSON, msg) {
		if(main.data.group[group] && main.data.group[group][id]) {
			if(isJSON) {
				if(exclude) {
					// Send JSON message to other group users
					main.data.group[group][id].clients.forEach((client) => {
						if(client != ws) {
							main.sendJSON(client, msg);
						}
					});
				}
				else {
					// Send JSON message to all group users
					main.data.group[group][id].clients.forEach((client) => {
						main.sendJSON(client, msg);
					});
				}
			}
			else {
				if(exclude) {
					// Send message to other group users
					main.data.group[group][id].clients.forEach((client) => {
						if(client != ws) {
							main.send(client, msg);
						}
					});
				}
				else {
					// Send message to all group users
					main.data.group[group][id].clients.forEach((client) => {
						main.send(client, msg);
					});
				}
			}
		}
	}
}

const main = new Main();