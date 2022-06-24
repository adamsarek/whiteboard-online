'use strict';

// Configuration details
const CONFIG = {
	allowed: {
		protocol: ['https'],
		hostname: ['www.whiteboard.ga'],
		mode: ['edit', 'view']
	}
};

// Whiteboard object default properties (used in drawing classes)
const WHITEBOARD_OBJECT = {
	active: {
		1: {
			lineColor: '#C06',
			lineWidth: 2
		},
		2: {
			lineColor: '#9C6086',
			lineWidth: 2
		},
		3: {
			lineColor: '#888',
			lineWidth: 2
		}
	},
	drawing: {
		lineCap: 'round',
		lineJoin: 'round'
	},
	note: {
		fontStyle: 'normal',
		fontVariant: 'normal',
		fontWeight: 400
	}
};

// Whiteboard theme default properties
const WHITEBOARD_THEME = {
	light: {
		theme_color: '#FFF',
		canvas: {
			background: '#EEE',
			grid: ['#E6E6E6', '#DDD', '#D5D5D5', '#BBB'],
			drawing: {
				lineColor: (fill) => { return getColorFromFill(fill, 0); }
			},
			note: {
				background: (fill) => { return getColorFromFill(fill, 8); },
				shadowColor: '#1113',
				textColor: (fill) => { return getColorFromFill(fill, 0); }
			},
			image: {
				shadowColor: '#1113'
			},
			shape: {
				background: (fill) => { return getColorFromFill(fill, 8); },
				shadowColor: '#1113'
			}
		}
	},
	dark: {
		theme_color: '#333',
		canvas: {
			background: '#222',
			grid: ['#2B2B2B', '#333', '#3C3C3C', '#555'],
			drawing: {
				lineColor: (fill) => { return getColorFromFill(fill, 10); }
			},
			note: {
				background: (fill) => { return getColorFromFill(fill, 3); },
				shadowColor: '#1116',
				textColor: (fill) => { return getColorFromFill(fill, 10); }
			},
			image: {
				shadowColor: '#1116'
			},
			shape: {
				background: (fill) => { return getColorFromFill(fill, 3); },
				shadowColor: '#1116'
			}
		}
	}
};

/**
 * Class offers automatized drawing of images by reacting to its certain steps during loading
 */
class ImageWrapper {
	object = new Image();
	canvasObjects = [];

	constructor(image, src) {
		this.object = image;
		this.object.src = src;
		this.object.onerror = this.object.onload = (event) => {
			for(let i = 0; i < this.canvasObjects.length; i++) {
				this.canvasObjects[i].draw();
			}
		};
	}

	set onerror(fn) { this.object.onerror = fn; }
	get onerror() { return this.object.onerror; }

	set onload(fn) { this.object.onload = fn; }
	get onload() { return this.object.onload; }

	addCanvasObject(canvasObject) {
		this.canvasObjects.push(canvasObject);
	}

	/**
	 * Checks whether the loading has finished (true for both successfully or not)
	 * @returns {Boolean} Has loading finished?
	 */
	isReady() {
		if(this.object && this.object.complete) {
			return true;
		}
		return false;
	}

	/**
	 * Checks whether the loading has finished successfully
	 * @returns {Boolean} Has loading finished successfully?
	 */
	canDraw() {
		if(this.isReady() && this.object.width > 0) {
			return true;
		}
		return false;
	}
}

/**
 * Used for efficient drawing of multiple connected lines (polylines)
 */
class WhiteboardCanvasPolyline {
	context;
	lineCap = 'butt';
	lineColor = '#000000';
	lineJoin = 'miter';
	lineWidth = 1;
	lines;

	setContext(context) {
		this.context = context;
	}

	setLineCap(lineCap) {
		this.lineCap = lineCap;
	}

	setLineColor(lineColor) {
		this.lineColor = lineColor;
	}

	setLineJoin(lineJoin) {
		this.lineJoin = lineJoin;
	}

	setLineWidth(lineWidth) {
		this.lineWidth = lineWidth;
	}

	setLines(lines) {
		this.lines = lines;
	}

	draw() {
		// Save default state
		this.context.save();

		// Drawing style
		if(this.lineCap != this.context.lineCap) { this.context.lineCap = this.lineCap; }
		if(this.lineColor != this.context.strokeStyle) { this.context.strokeStyle = this.lineColor; }
		if(this.lineJoin != this.context.lineJoin) { this.context.lineJoin = this.lineJoin; }
		if(this.lineWidth != this.context.lineWidth) { this.context.lineWidth = this.lineWidth; }

		// Start drawing
		this.context.beginPath();
		for(let i = 0; i < this.lines.length; i++) {
			// Move to line start
			this.context.moveTo(this.lines[i][0][0], this.lines[i][0][1]);

			// Draw all lines
			for(let j = 1; j < this.lines[i].length; j++) {
				this.context.lineTo(this.lines[i][j][0], this.lines[i][j][1]);
			}
		}
		this.context.stroke();

		// Restore default state
		this.context.restore();
	}
}

/**
 * Used for easier drawing of rounded rectangle
 */
class WhiteboardCanvasRoundedRectangle {
	context;
	x;
	y;
	w;
	h;
	background = '#000000';
	borderRadius = 0;
	shadowBlur = 0;
	shadowColor = '#000000';

	setContext(context) {
		this.context = context;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	setSize(w, h) {
		this.w = w;
		this.h = h;
	}

	setBackground(background) {
		this.background = background;
	}

	setBorderRadius(borderRadius) {
		this.borderRadius = borderRadius;
	}

	setShadowBlur(shadowBlur) {
		this.shadowBlur = shadowBlur;
	}

	setShadowColor(shadowColor) {
		this.shadowColor = shadowColor;
	}

	draw() {
		// Save default state
		this.context.save();

		// Drawing style
		if(this.background != this.context.fillStyle) { this.context.fillStyle = this.background; }
		if(this.shadowBlur != this.context.shadowBlur) { this.context.shadowBlur = this.shadowBlur; }
		if(this.shadowColor != this.context.shadowColor) { this.context.shadowColor = this.shadowColor; }

		// Start drawing
		this.context.beginPath();
		this.context.arc(this.x + this.w - this.borderRadius, this.y + this.borderRadius, this.borderRadius, -0.5 * Math.PI, 0);
		this.context.arc(this.x + this.w - this.borderRadius, this.y + this.h - this.borderRadius, this.borderRadius, 0, 0.5 * Math.PI);
		this.context.arc(this.x + this.borderRadius, this.y + this.h - this.borderRadius, this.borderRadius, 0.5 * Math.PI, Math.PI);
		this.context.arc(this.x + this.borderRadius, this.y + this.borderRadius, this.borderRadius, Math.PI, 1.5 * Math.PI);
		this.context.closePath();
		this.context.fill();

		// Restore default state
		this.context.restore();
	}
}

/**
 * Used for easy drawing of aligned multiline text
 */
class WhiteboardCanvasText {
	context;
	x;
	y;
	w;
	h;
	font = 'normal normal 400 16px system-ui';
	fontStyle = 'normal';
	fontVariant = 'normal';
	fontWeight = 400;
	fontSize = 16;
	fontFamily = 'system-ui';
	lineHeight = 20;
	padding = 0;
	textAlign = 'start';
	textBaseline = 'alphabetic';
	textColor = '#000000';
	content = '';

	setContext(context) {
		this.context = context;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	setSize(w, h) {
		this.w = w;
		this.h = h;
	}

	setFont(fontStyle, fontVariant, fontWeight, fontSize, fontFamily) {
		this.fontStyle = fontStyle;
		this.fontVariant = fontVariant;
		this.fontWeight = fontWeight;
		this.fontSize = fontSize;
		this.fontFamily = fontFamily;
		this.font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;
	}

	setLineHeight(lineHeight) {
		this.lineHeight = lineHeight;
	}

	setPadding(padding) {
		this.padding = padding;
	}

	setTextAlign(textAlign) {
		this.textAlign = textAlign;
	}

	setTextBaseline(textBaseline) {
		this.textBaseline = textBaseline;
	}

	setTextColor(textColor) {
		this.textColor = textColor;
	}

	setContent(content) {
		this.content = content;
	}

	draw() {
		// Save default state
		this.context.save();

		// Drawing style
		if(this.font != this.context.font) { this.context.font = this.font; }
		if(this.textAlign != this.context.textAlign) { this.context.textAlign = this.textAlign; }
		if(this.textBaseline != this.context.textBaseline) { this.context.textBaseline = this.textBaseline; }
		if(this.textColor != this.context.fillStyle) { this.context.fillStyle = this.textColor; }

		// Start drawing
		const textarea = document.createElement('textarea');
		const contentRows = this.content.replaceAll('<br>', '').split('</div>');
		for(let i = 0; i < contentRows.length - 1; i++) {
			textarea.innerHTML = contentRows[i].split('<div>')[1];
			const textAlignX = (this.textAlign == 'left' ? this.x + this.padding : (this.textAlign == 'center' ? this.x + this.w * 0.5 : this.x + this.w - this.padding));
			this.context.fillText(textarea.value, textAlignX, this.y + this.padding + this.lineHeight * 0.2 + this.lineHeight * i);
		}

		// Restore default state
		this.context.restore();
	}
}

/**
 * Class draws note using WhiteboardCanvasRoundedRectangle on background and WhiteboardCanvasText on foreground
 */
class WhiteboardCanvasNote {
	context;
	rectangle = new WhiteboardCanvasRoundedRectangle();
	text = new WhiteboardCanvasText();

	setContext(context) {
		this.rectangle.setContext(context);
		this.text.setContext(context);
	}

	setPosition(x, y) {
		this.rectangle.setPosition(x, y);
		this.text.setPosition(x, y);
	}

	setSize(w, h) {
		this.rectangle.setSize(w, h);
		this.text.setSize(w, h);
	}

	setBackground(background) {
		this.rectangle.setBackground(background);
	}

	setBorderRadius(borderRadius) {
		this.rectangle.setBorderRadius(borderRadius);
	}

	setFont(fontStyle, fontVariant, fontWeight, fontSize, fontFamily) {
		this.text.setFont(fontStyle, fontVariant, fontWeight, fontSize, fontFamily);
	}

	setLineHeight(lineHeight) {
		this.text.setLineHeight(lineHeight);
	}

	setPadding(padding) {
		this.text.setPadding(padding);
	}

	setShadowBlur(shadowBlur) {
		this.rectangle.setShadowBlur(shadowBlur);
	}

	setShadowColor(shadowColor) {
		this.rectangle.setShadowColor(shadowColor);
	}

	setTextAlign(textAlign) {
		this.text.setTextAlign(textAlign);
	}

	setTextBaseline(textBaseline) {
		this.text.setTextBaseline(textBaseline);
	}

	setTextColor(textColor) {
		this.text.setTextColor(textColor);
	}

	setContent(content) {
		this.text.setContent(content);
	}

	draw() {
		this.rectangle.draw();
		this.text.draw();
	}
}

/**
 * Used for drawing images or replacing them with corresponding icon
 */
class WhiteboardCanvasImage {
	context;
	x;
	y;
	w;
	h;
	borderRadius = 0;
	shadowBlur = 0;
	shadowColor = '#000000';
	icon = {};
	image;

	setContext(context) {
		this.context = context;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	setSize(w, h) {
		this.w = w;
		this.h = h;
	}

	setBorderRadius(borderRadius) {
		this.borderRadius = borderRadius;
	}

	setShadowBlur(shadowBlur) {
		this.shadowBlur = shadowBlur;
	}

	setShadowColor(shadowColor) {
		this.shadowColor = shadowColor;
	}

	setIcons(image, brokenImage) {
		this.icon.image = image;
		this.icon.image.addCanvasObject(this);
		this.icon.brokenImage = brokenImage;
		this.icon.brokenImage.addCanvasObject(this);
	}

	setImage(image) {
		this.image = image;
		this.image.addCanvasObject(this);
	}

	draw() {
		// Save default state
		this.context.save();

		// Drawing style
		if(this.shadowBlur != this.context.shadowBlur) { this.context.shadowBlur = this.shadowBlur; }
		if(this.shadowColor != this.context.shadowColor) { this.context.shadowColor = this.shadowColor; }

		// Start drawing
		this.context.beginPath();
		this.context.arc(this.x + this.w - this.borderRadius, this.y + this.borderRadius, this.borderRadius, -0.5 * Math.PI, 0);
		this.context.arc(this.x + this.w - this.borderRadius, this.y + this.h - this.borderRadius, this.borderRadius, 0, 0.5 * Math.PI);
		this.context.arc(this.x + this.borderRadius, this.y + this.h - this.borderRadius, this.borderRadius, 0.5 * Math.PI, Math.PI);
		this.context.arc(this.x + this.borderRadius, this.y + this.borderRadius, this.borderRadius, Math.PI, 1.5 * Math.PI);
		this.context.closePath();
		this.context.fill();
		this.context.clip();
		// Image non set, loaded or existent
		if(!this.image || !this.image.canDraw()) {
			let r = 16;
			let x = this.x;
			let y = this.y;
			let w = r;
			let h = r;
			if(this.w > w && this.h > h) {
				x = this.x + (this.w - w) * 0.5;
				y = this.y + (this.h - h) * 0.5;
			}
			else {
				w = this.w;
				h = this.h;
			}

			// Image not yet loaded
			if(!this.image.isReady()) {
				this.context.fillStyle = '#111';
				this.context.strokeStyle = '#999';
				this.context.fill();
				this.context.stroke();
				this.context.beginPath();
				this.context.arc(this.x + this.w * 0.5, this.y + this.h * 0.5, r, 0, Math.PI * 2);
				this.context.fillStyle = '#333';
				this.context.shadowBlur = 4;
				this.context.shadowColor = '#0006';
				this.context.fill();
				if(this.icon.image && this.icon.image.canDraw()) { this.context.drawImage(this.icon.image.object, x, y, w, h); }
			}
			// Image already loaded
			else {
				this.context.fillStyle = '#100';
				this.context.strokeStyle = '#900';
				this.context.fill();
				this.context.stroke();
				this.context.beginPath();
				this.context.arc(this.x + this.w * 0.5, this.y + this.h * 0.5, r, 0, Math.PI * 2);
				this.context.fillStyle = '#300';
				this.context.shadowBlur = 4;
				this.context.shadowColor = '#0006';
				this.context.fill();
				if(this.icon.brokenImage && this.icon.brokenImage.canDraw()) { this.context.drawImage(this.icon.brokenImage.object, x, y, w, h); }
			}
		}
		// Image loaded successfully
		else {
			this.context.drawImage(this.image.object, this.x, this.y, this.w, this.h);
		}

		// Restore default state
		this.context.restore();
	}
}

/**
 * Class offers drawing of all types of shapes at one place
 */
class WhiteboardCanvasShape {
	context;
	x;
	y;
	w;
	h;
	fX;
	fY;
	tX;
	tY;
	shadowBlur = 0;
	shadowColor = '#000000';
	shapeType = 'rectangle';

	setContext(context) {
		this.context = context;
	}

	setPosition(x, y, fX, fY, tX, tY) {
		this.x = x;
		this.y = y;
		this.fX = fX;
		this.fY = fY;
		this.tX = tX;
		this.tY = tY;
	}

	setSize(w, h) {
		this.w = w;
		this.h = h;
	}

	setBackground(background) {
		this.background = background;
	}

	setShadowBlur(shadowBlur) {
		this.shadowBlur = shadowBlur;
	}

	setShadowColor(shadowColor) {
		this.shadowColor = shadowColor;
	}

	setShapeType(shapeType) {
		this.shapeType = shapeType;
	}

	draw() {
		// Save default state
		this.context.save();

		// Drawing style
		if(this.background != this.context.fillStyle) { this.context.fillStyle = this.background; }
		if(this.shadowBlur != this.context.shadowBlur) { this.context.shadowBlur = this.shadowBlur; }
		if(this.shadowColor != this.context.shadowColor) { this.context.shadowColor = this.shadowColor; }

		// Start drawing
		this.context.beginPath();
		switch(this.shapeType) {
			case 'rectangle': {
				this.context.rect(this.x, this.y, this.w, this.h);
				break;
			}
			case 'ellipse': {
				this.context.ellipse(this.x + this.w * 0.5, this.y + this.h * 0.5, this.w * 0.5, this.h * 0.5, 0, 0, Math.PI * 2);
				break;
			}
			case 'right_triangle': {
				if(this.tX < this.fX && this.tY < this.fY) {
					this.context.moveTo(this.x + this.w, this.y + this.h);
					this.context.lineTo(this.x + this.w, this.y);
					this.context.lineTo(this.x, this.y);
				}
				else if(this.tX < this.fX && this.tY > this.fY) {
					this.context.moveTo(this.x + this.w, this.y);
					this.context.lineTo(this.x + this.w, this.y + this.h);
					this.context.lineTo(this.x, this.y + this.h);
				}
				else if(this.tX > this.fX && this.tY < this.fY) {
					this.context.moveTo(this.x, this.y + this.h);
					this.context.lineTo(this.x, this.y);
					this.context.lineTo(this.x + this.w, this.y);
				}
				else if(this.tX > this.fX && this.tY > this.fY) {
					this.context.moveTo(this.x, this.y);
					this.context.lineTo(this.x, this.y + this.h);
					this.context.lineTo(this.x + this.w, this.y + this.h);
				}
				this.context.closePath();
				break;
			}
			case 'isosceles_triangle': {
				if(this.tX < this.fX && this.tY < this.fY) {
					this.context.moveTo(this.x, this.y);
					this.context.lineTo(this.x + this.w, this.y);
					this.context.lineTo(this.x + this.w * 0.5, this.y + this.h);
				}
				else if(this.tX < this.fX && this.tY > this.fY) {
					this.context.moveTo(this.x, this.y);
					this.context.lineTo(this.x, this.y + this.h);
					this.context.lineTo(this.x + this.w, this.y + this.h * 0.5);
				}
				else if(this.tX > this.fX && this.tY < this.fY) {
					this.context.moveTo(this.x + this.w, this.y + this.h);
					this.context.lineTo(this.x + this.w, this.y);
					this.context.lineTo(this.x, this.y + this.h * 0.5);
				}
				else if(this.tX > this.fX && this.tY > this.fY) {
					this.context.moveTo(this.x, this.y + this.h);
					this.context.lineTo(this.x + this.w, this.y + this.h);
					this.context.lineTo(this.x + this.w * 0.5, this.y);
				}
				this.context.closePath();
				break;
			}
			case 'rhombus': {
				this.context.moveTo(this.x + this.w * 0.5, this.y);
				this.context.lineTo(this.x + this.w, this.y + this.h * 0.5);
				this.context.lineTo(this.x + this.w * 0.5, this.y + this.h);
				this.context.lineTo(this.x, this.y + this.h * 0.5);
				this.context.closePath();
				break;
			}
		}
		this.context.fill();

		// Restore default state
		this.context.restore();
	}
}

/**
 * Used for easy control over efficient objects rendering
 */
class WhiteboardCanvas {
	redrawRequested = true;
	context;
	objects = [];

	constructor(canvas=null) {
		if(canvas) { this.linkHtml(canvas); }
	}

	linkHtml(canvas) {
		this.context = canvas.getContext('2d', { alpha: true, desynchronized: true });

		for(let i = 0; i < this.objects.length; i++) { this.objects[i].setContext(this.context); }

		this.redraw();
	}

	setObjects(objects) {
		this.objects = objects;

		if(this.context) {
			for(let i = 0; i < this.objects.length; i++) { this.objects[i].setContext(this.context); }
		}
	}

	clear() {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}

	draw() {
		for(let i = 0; i < this.objects.length; i++) {
			this.objects[i].draw();

			// Rectangle around selected object
			if(this.objects[i].active > 0) {
				const objectRect = (this.objects[i].name == 'note' ? this.objects[i].rectangle : this.objects[i]);

				// Save default state
				this.context.save();

				// Drawing style
				this.context.strokeStyle = WHITEBOARD_OBJECT.active[this.objects[i].active].lineColor;
				this.context.lineWidth = WHITEBOARD_OBJECT.active[this.objects[i].active].lineWidth;

				// Start drawing
				this.context.beginPath();
				this.context.rect(objectRect.x - this.context.lineWidth * 0.5, objectRect.y - this.context.lineWidth * 0.5, objectRect.w + this.context.lineWidth, objectRect.h + this.context.lineWidth);
				this.context.stroke();

				// Restore default state
				this.context.restore();
			}
		}
	}

	// Request for one rendering cycle (after one or more objects being changed)
	requestRedraw() {
		this.redrawRequested = true;
	}

	redraw() {
		// Redraw requested
		if(this.redrawRequested) {
			this.redrawRequested = false;
			this.clear();
			this.draw();
		}

		// Repeating redraw() function (maximum frequency matches monitor refresh rate)
		requestAnimationFrame(this.redraw.bind(this));
	}
}

/**
 * Main class for whiteboard edit and view page
 */
class Whiteboard {
	// Private - brief properties
	exporting = false; // Website is in process of exporting
	grid = 'full';
	html = {}; // All HTML elements linked through DOM
	initialized = false;
	theme = 'dark';
	documentTitle = document.title; // Initial page title
	title = ''; // Whiteboard title
	user = -1; // User id

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
	canvas = {
		export: new WhiteboardCanvas(document.createElement('canvas')),
		grid: new WhiteboardCanvas(),
		main: new WhiteboardCanvas(),
		size: {
			w: 0,
			h: 0
		},
		zoom: 1,
		linkHtml: () => {
			this.canvas.grid.linkHtml(this.html.gridCanvas);
			this.canvas.main.linkHtml(this.html.mainCanvas);
		},
		clear: () => {
			this.canvas.grid.clear();
			this.canvas.main.clear();
		},
		draw: () => {
			this.canvas.grid.draw();
			this.canvas.main.draw();
		},
		redraw: () => {
			this.canvas.grid.requestRedraw();
			this.canvas.main.requestRedraw();
		},
		setData: (canvas, data) => {
			const objects = [];

			switch(canvas) {
				case 'export': {
					// Background
					let object = new WhiteboardCanvasShape();
					object.setPosition(0, 0);
					object.setSize(this.canvas[canvas].context.canvas.width, this.canvas[canvas].context.canvas.height);
					object.setBackground(WHITEBOARD_THEME[this.theme].canvas.background);
					object.setShapeType('rectangle');
					objects.push(object);

					// Grid
					if(data[0]) {
						for(let i = 0; i < data[0].length; i++) {
							const polyline = new WhiteboardCanvasPolyline();
							polyline.setLineColor(WHITEBOARD_THEME[this.theme].canvas.grid[i]);
							polyline.setLines(data[0][i]);
							objects.push(polyline);
						}
					}

					// Objects
					if(data[1]) {
						for(let i = 0; i < data[1].length; i++) {
							switch(data[1][i].name) {
								case 'drawing': {
									object = new WhiteboardCanvasPolyline();
									object.name = data[1][i].name;
									object.fill = data[1][i].fill;
									object.x = data[1][i].x;
									object.y = data[1][i].y;
									object.w = data[1][i].w;
									object.h = data[1][i].h;
									object.setLineCap(WHITEBOARD_OBJECT[object.name].lineCap);
									object.setLineColor(WHITEBOARD_THEME[this.theme].canvas.drawing.lineColor(object.fill));
									object.setLineJoin(WHITEBOARD_OBJECT[object.name].lineJoin);
									object.setLineWidth(data[1][i].lineWidth);
									object.setLines(data[1][i].lines);
									objects.push(object);
									break;
								}
								case 'note': {
									object = new WhiteboardCanvasNote();
									object.name = data[1][i].name;
									object.fill = data[1][i].fill;
									object.setPosition(data[1][i].x, data[1][i].y);
									object.setSize(data[1][i].w, data[1][i].h);
									object.setBackground(WHITEBOARD_THEME[this.theme].canvas.note.background(object.fill));
									object.setBorderRadius(data[1][i].borderRadius);
									object.setFont(WHITEBOARD_OBJECT[object.name].fontStyle, WHITEBOARD_OBJECT[object.name].fontVariant, WHITEBOARD_OBJECT[object.name].fontWeight, data[1][i].fontSize, data[1][i].fontFamily);
									object.setLineHeight(data[1][i].fontSize * data[1][i].lineHeight);
									object.setPadding(data[1][i].padding);
									object.setShadowBlur(data[1][i].shadowBlur);
									object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.note.shadowColor);
									object.setTextAlign(data[1][i].textAlign);
									object.setTextBaseline('top');
									object.setTextColor(WHITEBOARD_THEME[this.theme].canvas.note.textColor(object.fill));
									object.setContent(data[1][i].content);
									objects.push(object);
									break;
								}
								case 'image': {
									if(!this.imageStack[data[1][i].src]) {
										this.imageStack[data[1][i].src] = new ImageWrapper(new Image(), data[1][i].src);
									}
									object = new WhiteboardCanvasImage();
									object.name = data[1][i].name;
									object.setPosition(data[1][i].x, data[1][i].y);
									object.setSize(data[1][i].w, data[1][i].h);
									object.setBorderRadius(data[1][i].borderRadius);
									object.setShadowBlur(data[1][i].shadowBlur);
									object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.image.shadowColor);
									object.setIcons(this.imageStack.image, this.imageStack.brokenImage);
									object.setImage(this.imageStack[data[1][i].src]);
									objects.push(object);
									break;
								}
								case 'shape': {
									object = new WhiteboardCanvasShape();
									object.name = data[1][i].name;
									object.fill = data[1][i].fill;
									object.setPosition(data[1][i].x, data[1][i].y, data[1][i].fX, data[1][i].fY, data[1][i].tX, data[1][i].tY);
									object.setSize(data[1][i].w, data[1][i].h);
									object.setBackground(WHITEBOARD_THEME[this.theme].canvas.shape.background(object.fill));
									object.setShadowBlur(data[1][i].shadowBlur);
									object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.shape.shadowColor);
									object.setShapeType(data[1][i].shapeType);
									objects.push(object);
									break;
								}
							}
						}
					}
					break;
				}
				case 'grid': {
					for(let i = 0; i < data.length; i++) {
						const polyline = new WhiteboardCanvasPolyline();
						polyline.setLineColor(WHITEBOARD_THEME[this.theme].canvas.grid[i]);
						polyline.setLines(data[i]);
						objects.push(polyline);
					}
					break;
				}
				case 'main': {
					for(let i = 0; i < data.length; i++) {
						let object;
						switch(data[i].name) {
							case 'drawing': {
								object = new WhiteboardCanvasPolyline();
								object.name = data[i].name;
								object.fill = data[i].fill;
								object.x = data[i].vX;
								object.y = data[i].vY;
								object.w = data[i].vW;
								object.h = data[i].vH;
								object.active = (this.access.mode == 'edit' ? (data[i].user != this.user && data[i].user != -1 ? 3 : (data[i].user == this.user && this.tool.mode != 'add' ? (data[i].active == 0 ? 2 : 1) : 0)) : 0);
								object.setLineCap(WHITEBOARD_OBJECT[object.name].lineCap);
								object.setLineColor(WHITEBOARD_THEME[this.theme].canvas.drawing.lineColor(object.fill));
								object.setLineJoin(WHITEBOARD_OBJECT[object.name].lineJoin);
								object.setLineWidth(data[i].vLineWidth);
								object.setLines(data[i].vLines);
								objects.push(object);
								break;
							}
							case 'note': {
								object = new WhiteboardCanvasNote();
								object.name = data[i].name;
								object.fill = data[i].fill;
								object.active = (this.access.mode == 'edit' ? (data[i].user != this.user && data[i].user != -1 ? 3 : (data[i].user == this.user && this.tool.mode != 'add' ? (data[i].active == 0 ? 2 : 1) : 0)) : 0);
								object.setPosition(data[i].vX, data[i].vY);
								object.setSize(data[i].vW, data[i].vH);
								object.setBackground(WHITEBOARD_THEME[this.theme].canvas.note.background(object.fill));
								object.setBorderRadius(data[i].vBorderRadius);
								object.setFont(WHITEBOARD_OBJECT[object.name].fontStyle, WHITEBOARD_OBJECT[object.name].fontVariant, WHITEBOARD_OBJECT[object.name].fontWeight, data[i].vFontSize, data[i].fontFamily);
								object.setLineHeight(data[i].vFontSize * data[i].lineHeight);
								object.setPadding(data[i].vPadding);
								object.setShadowBlur(data[i].vShadowBlur);
								object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.note.shadowColor);
								object.setTextAlign(data[i].textAlign);
								object.setTextBaseline('top');
								object.setTextColor(WHITEBOARD_THEME[this.theme].canvas.note.textColor(object.fill));
								object.setContent(data[i].content);
								objects.push(object);
								break;
							}
							case 'image': {
								if(!this.imageStack[data[i].src]) {
									this.imageStack[data[i].src] = new ImageWrapper(new Image(), data[i].src);
								}
								object = new WhiteboardCanvasImage();
								object.name = data[i].name;
								object.active = (this.access.mode == 'edit' ? (data[i].user != this.user && data[i].user != -1 ? 3 : (data[i].user == this.user && this.tool.mode != 'add' ? (data[i].active == 0 ? 2 : 1) : 0)) : 0);
								object.setPosition(data[i].vX, data[i].vY);
								object.setSize(data[i].vW, data[i].vH);
								object.setBorderRadius(data[i].vBorderRadius);
								object.setShadowBlur(data[i].vShadowBlur);
								object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.image.shadowColor);
								object.setIcons(this.imageStack.image, this.imageStack.brokenImage);
								object.setImage(this.imageStack[data[i].src]);
								objects.push(object);
								break;
							}
							case 'shape': {
								object = new WhiteboardCanvasShape();
								object.name = data[i].name;
								object.fill = data[i].fill;
								object.active = (this.access.mode == 'edit' ? (data[i].user != this.user && data[i].user != -1 ? 3 : (data[i].user == this.user && this.tool.mode != 'add' ? (data[i].active == 0 ? 2 : 1) : 0)) : 0);
								object.setPosition(data[i].vX, data[i].vY, data[i].vFX, data[i].vFY, data[i].vTX, data[i].vTY);
								object.setSize(data[i].vW, data[i].vH);
								object.setBackground(WHITEBOARD_THEME[this.theme].canvas.shape.background(object.fill));
								object.setShadowBlur(data[i].vShadowBlur);
								object.setShadowColor(WHITEBOARD_THEME[this.theme].canvas.shape.shadowColor);
								object.setShapeType(data[i].shapeType);
								objects.push(object);
								break;
							}
						}
					}
					break;
				}
			}

			this.canvas[canvas].setObjects(objects);
			this.canvas[canvas].requestRedraw();
		}
	};
	engine = {
		worker: null,
		// Functions requested by engine
		fn: {
			error: (errorCode) => {
				this.error(errorCode);
			},
			reconnect: () => {
				location.reload();
			},
			serverClose: () => {
				// Reset tool
				this.setTool(null, null, null, true);

				// Reset GUI
				if(this.html.title && this.html.canvas && this.html.dashboard && this.html.overlay && this.html.loading) {
					this.html.title.removeAttribute('contenteditable');
					this.html.canvas.classList.add('o-canvas--hidden');
					this.html.dashboard.classList.add('o-dashboard--hidden');
					this.html.dashboard.classList.remove('o-dashboard--visible');
					this.html.overlay.classList.remove('o-overlay--hidden');
					this.html.loading.classList.remove('c-loading--hidden');
				}
			},
			setTitle: (title) => {
				this.title = title;
				document.title = this.title + ' - ' + this.documentTitle;
				if(this.html.title) {
					this.html.title.innerText = this.title + '\n';
					if(this.title == '') { this.html.title.innerHTML = ''; }
					this.html.title.title = this.title;
				}
			},
			setUser: (user) => {
				this.user = user;
			},
			init: (owner) => {
				this.initialized = true;

				if(this.html.title && this.html.canvas && this.html.dashboard && this.html.overlay && this.html.loading) {
					if(owner) { this.html.title.setAttribute('contenteditable', true); }
					this.html.canvas.classList.remove('o-canvas--hidden');
					this.html.dashboard.classList.remove('o-dashboard--hidden');
					this.html.dashboard.classList.add('o-dashboard--visible');
					this.html.overlay.classList.add('o-overlay--hidden');
					this.html.loading.classList.add('c-loading--hidden');
				}
			},
			setCanvasSize: (w, h) => {
				this.canvas.size.w = w;
				this.canvas.size.h = h;
				if(this.html.gridCanvas && this.html.mainCanvas) {
					this.html.gridCanvas.width =  this.html.mainCanvas.width =  this.canvas.size.w;
					this.html.gridCanvas.height = this.html.mainCanvas.height = this.canvas.size.h;
				}
			},
			setCanvasZoom: (zoom) => {
				this.canvas.zoom = zoom;
				this.html.zoomRestore.innerHTML = (zoom * 100).toFixed(0) + '%';
			},
			setGridCanvasData: (data) => {
				this.canvas.setData('grid', data);
			},
			setMainCanvasData: (data) => {
				this.canvas.setData('main', data);
			},
			export: (type, w, h, data) => {
				switch(type) {
					case 'json': {
						if(data.length > 0) {
							// Convert data to JSON
							const jsonData = JSON.stringify({
								objects: data,
								size: {
									w: w,
									h: h
								}
							});
							const blob = new Blob([jsonData], { type: 'application/json' });
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.download = this.title + '.' + type;
							a.href = url;
							a.click();

							// Revoke already read blob from memory
							URL.revokeObjectURL(url);

							// Allow another export
							this.exporting = false;
						}
						else {
							this.exporting = false;
						}
						break;
					}
					default: {
						if(data.length > 0) {
							this.canvas.export.context.canvas.width = w;
							this.canvas.export.context.canvas.height = h;
							this.canvas.setData('export', data);

							const exportInterval = setInterval(() => {
								if(!this.canvas.export.redrawRequest) {
									// MIME Type
									let mimeType = '';
									switch(type) {
										case 'bmp': {
											mimeType = 'image/bmp';
											break;
										}
										case 'jpg': {
											mimeType = 'image/jpeg';
											break;
										}
										default: {
											mimeType = 'image/png';
											break;
										}
									}

									// Convert canvas to image
									this.canvas.export.context.canvas.toBlob((blob) => {
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.download = this.title + '.' + type;
										a.href = url;
										a.click();

										// Revoke already read blob from memory
										URL.revokeObjectURL(url);

										// Allow another export
										this.exporting = false;
									}, mimeType, 1);

									clearInterval(exportInterval);
								}
							}, 1);
						}
						else {
							this.exporting = false;
						}
						break;
					}
				}
			},
			setTool: (mode, type, property) => {
				this.setTool(mode, type, property);
			},
			setFill: (fill) => {
				this.html.toolPropertyFillButton.value = '#' + fill[0] + fill[0] + fill[1] + fill[1] + fill[2] + fill[2];
			},
			setFontFamily: (fontFamily) => {
				this.html.toolPropertyFontFamilyButton.value = fontFamily;
			},
			setFontSize: (fontSize) => {
				this.html.toolPropertyFontSizeButton.value = fontSize;
			},
			setLineWidth: (lineWidth) => {
				this.html.toolPropertyLineWidthButton.value = lineWidth;
			},
			setShapeType: (shapeType) => {
				this.html.toolPropertyShapeTypeButton.value = shapeType;
			},
			setTextAlign: (textAlign) => {
				this.html.toolPropertyTextAlignText.innerHTML = this.html.toolPropertyTextAlignButton.dataset['select' + textAlign[0].toUpperCase() + textAlign.slice(1) + 'Text'];
				this.html.toolPropertyTextAlignButton.value = textAlign;
			},
			styleNote: (fill) => {
				this.html.note.style.background = WHITEBOARD_THEME[this.theme].canvas.note.background(fill);
				this.html.noteContent.style.color = WHITEBOARD_THEME[this.theme].canvas.note.textColor(fill);
			},
			openNote: (fill, x, y, minW, minH, maxW, maxH, borderRadius, fontSize, vFontSize, fontFamily, lineHeight, padding, textAlign, content, focus) => {
				this.engine.fn.styleNote(fill);
				this.html.toolPropertyFontFamilyButton.value = fontFamily;
				this.html.toolPropertyFontSizeButton.value = fontSize;
				this.html.toolPropertyTextAlignText.innerHTML = this.html.toolPropertyTextAlignButton.dataset['select' + textAlign[0].toUpperCase() + textAlign.slice(1) + 'Text'];
				this.html.toolPropertyTextAlignButton.value = textAlign;
				this.html.note.style.top = y + 'px';
				this.html.note.style.left = x + 'px';
				this.html.note.style.borderRadius = borderRadius + 'px';
				this.html.noteContent.style.minWidth = minW + 'px';
				this.html.noteContent.style.minHeight = minH + 'px';
				this.html.noteContent.style.maxWidth = maxW + 'px';
				this.html.noteContent.style.maxHeight = maxH + 'px';
				this.html.noteContent.style.fontStyle = WHITEBOARD_OBJECT.note.fontStyle;
				this.html.noteContent.style.fontVariant = WHITEBOARD_OBJECT.note.fontVariant;
				this.html.noteContent.style.fontWeight = WHITEBOARD_OBJECT.note.fontWeight;
				this.html.noteContent.style.fontSize = vFontSize + 'px';
				this.html.noteContent.style.fontFamily = fontFamily;
				this.html.noteContent.style.lineHeight = lineHeight;
				this.html.noteContent.style.margin = padding + 'px';
				this.html.noteContent.style.textAlign = textAlign;
				this.html.noteContent.innerHTML = content;
				if(focus) { this.html.noteContent.focus(); }
				this.html.note.classList.remove('u-opacity--0');
				this.html.note.classList.remove('u-pointer-events--none');
				this.editNoteContent();
			},
			closeNote: () => {
				this.html.note.classList.add('u-opacity--0');
				this.html.note.classList.add('u-pointer-events--none');
			}
		}
	};
	imageStack = {
		'image': new ImageWrapper(new Image(), 'src/img/image.svg'),
		'brokenImage': new ImageWrapper(new Image(), 'src/img/broken_image.svg')
	};
	tool = {
		mode: null,
		type: null,
		property: null,
		fill: '999',
		fontFamily: 'Arial, sans-serif',
		fontSize: 12,
		lineWidth: 8,
		shapeType: 'rectangle',
		textAlign: 'left'
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
			this.canvas.linkHtml();

			// LocalStorage
			if(this.engine.worker) {
				if(localStorage.getItem('grid') !== null) { this.setGrid(localStorage.getItem('grid')); }
				if(localStorage.getItem('theme') !== null) { this.setTheme(localStorage.getItem('theme')); }
			}

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
					this.html.title.innerText = this.title + '\n';
					if(this.title == '') { this.html.title.innerHTML = ''; }
					this.html.title.title = this.title;
				}

				this.html.canvas.classList.remove('o-canvas--hidden');
				this.html.dashboard.classList.remove('o-dashboard--hidden');
				this.html.dashboard.classList.add('o-dashboard--visible');
				this.html.overlay.classList.add('o-overlay--hidden');
				this.html.loading.classList.add('c-loading--hidden');

				this.html.gridCanvas.width =  this.html.mainCanvas.width =  this.canvas.size.w;
				this.html.gridCanvas.height = this.html.mainCanvas.height = this.canvas.size.h;
			}

			// Places
			if(this.html.places) {
				this.html.places.value = '';
				this.html.places.onchange = (event) => {
					const pos = event.target.value.split(';');
					this.engine.worker.postMessage(['setPosition', [pos[0], pos[1]]]);
					event.target.value = '';
				};
			}

			// Export
			if(this.html.export) {
				this.html.export.value = '';
				this.html.export.onchange = (event) => {
					if(!this.exporting) {
						this.exporting = true;
						this.engine.worker.postMessage(['export', [event.target.value]]);
					}
					event.target.value = '';
				};
			}

			// Share
			if(this.html.share) {
				this.html.share.value = '';
				this.html.share.onchange = (event) => {
					const link = [location.protocol, '//', location.host, location.pathname].join('');
					switch(event.target.value) {
						case 'copy': {
							navigator.clipboard.writeText(link);
							alert(event.target.dataset.copyText);
							break;
						}
						case 'email': {
							const email = prompt(event.target.dataset.emailText);
							if(email) {
								const formData = new FormData();
								formData.append('to', email);
								formData.append('from', this.access.user.getBasicProfile().getEmail());
								formData.append('link', link);
								formData.append('whiteboard', this.title);
								formData.append('signature', this.access.user.getBasicProfile().getName());
								fetch('/email.php', {
									method: 'POST',
									body: formData
								})
								.then(response => response.json())
								.then(data => {
									alert(data.msg);
									if(data.error) {
										throw Error(data.msg);
									}
								})
								.catch(error => {
									throw Error(error);
								});
							}
							break;
						}
						case 'email_manually': {
							const email = prompt(event.target.dataset.emailText);
							if(email) {
								const subject = event.target.dataset.emailSubject.replaceAll('[WHITEBOARD]', this.title);
								const body = event.target.dataset.emailBody.replace('[WHITEBOARD]', link).replace('[USER]', this.access.user.getBasicProfile().getName());

								const a = document.createElement('a');
								a.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
								a.click();
							}
							break;
						}
					}
					event.target.value = '';
				};
			}

			// Note
			if(this.html.noteContent) {
				this.html.noteContent.oninput = (event) => {
					this.editNoteContent();
				};
				this.html.noteContent.onpaste = (event) => {
					event.preventDefault();
					document.execCommand('insertText', false, event.clipboardData.getData('text/plain').replaceAll('\t', '    '));
					this.editNoteContent();
				};
			}

			// Inputs
			if(this.html.title) {
				this.html.title.oninput = (event) => {
					this.title = event.target.textContent;
					document.title = this.title + ' - ' + this.documentTitle;
					if(this.title == '') { event.target.innerHTML = ''; }
					event.target.title = this.title;
					this.engine.worker.postMessage(['setTitle', [this.title]]);
				};
			}
			if(this.html.languageSelect) {
				this.html.languageSelect.value = '';
				this.html.languageSelect.onchange = (event) => {
					const url = new URL(location.href);
					url.searchParams.set('lang', event.target.value);
					location.href = url;

					event.target.value = '';
				};
			}
			if(this.html.userSelect) {
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
			}
			if(this.html.uploadSourceFileButton) {
				this.html.uploadSourceFileButton.onclick = (event) => {
					this.html.sourceFileInput.click();
				};
			}
			if(this.html.sourceFileInput) {
				this.html.sourceFileInput.onchange = (event) => {
					if(event.target.files.length == 1) {
						this.engine.worker.postMessage(['addSourceFile', [event.target.files[0]]]);
						event.target.value = '';
					}
				};
			}
			if(this.html.imageInput) {
				this.html.imageInput.onchange = (event) => {
					if(event.target.files.length == 1) {
						this.engine.worker.postMessage(['setImage', [event.target.files[0]]]);
						event.target.value = '';
					}
				};
			}
			if(this.html.toolPropertyFillButton) {
				this.html.toolPropertyFillButton.onchange = (event) => {
					const r = parseInt(event.target.value.slice(1, 3), 16) / 51;
					const g = parseInt(event.target.value.slice(3, 5), 16) / 51;
					const b = parseInt(event.target.value.slice(5, 7), 16) / 51;
					const rStr = (Math.round(r) * 3).toString(16);
					const gStr = (Math.round(g) * 3).toString(16);
					const bStr = (Math.round(b) * 3).toString(16);
					if(r % 1 != 0 || g % 1 != 0 || b % 1 != 0) {
						event.target.value = '#' + rStr + rStr + gStr + gStr + bStr + bStr;
					}
					this.tool.fill = rStr + gStr + bStr;
					this.engine.worker.postMessage(['setFill', [rStr + gStr + bStr]]);
				};
			}
			if(this.html.toolPropertyFontFamilyButton) {
				this.html.toolPropertyFontFamilyButton.onchange = (event) => {
					this.tool.fontFamily = event.target.value;
					this.engine.worker.postMessage(['setFontFamily', [event.target.value]]);
				};
			}
			if(this.html.toolPropertyFontSizeButton) {
				this.html.toolPropertyFontSizeButton.onchange = (event) => {
					this.tool.fontSize = event.target.value;
					this.engine.worker.postMessage(['setFontSize', [event.target.value]]);
				};
			}
			if(this.html.toolPropertyLineWidthButton) {
				this.html.toolPropertyLineWidthButton.onchange = (event) => {
					this.tool.lineWidth = event.target.value;
					this.engine.worker.postMessage(['setLineWidth', [event.target.value]]);
				};
			}
			if(this.html.toolPropertyShapeTypeButton) {
				this.html.toolPropertyShapeTypeButton.onchange = (event) => {
					this.tool.shapeType = event.target.value;
					this.engine.worker.postMessage(['setShapeType', [event.target.value]]);
				};
			}
			if(this.html.toolPropertyTextAlignButton) {
				this.html.toolPropertyTextAlignButton.onchange = (event) => {
					this.html.toolPropertyTextAlignText.innerHTML = this.html.toolPropertyTextAlignButton.dataset['select' + event.target.value[0].toUpperCase() + event.target.value.slice(1) + 'Text'];
					this.tool.textAlign = event.target.value;
					this.engine.worker.postMessage(['setTextAlign', [event.target.value]]);
				};
			}

			// Tool events
			if(this.html.toolDeleteButton) {
				this.html.toolDeleteButton.onclick = (event) => {
					event.preventDefault();
					this.engine.worker.postMessage(['deleteObject', []]);
					this.setTool(null, null, null, true);
				};
			}
			if(document.querySelectorAll('[id^="whiteboard-tool-close-"][id$="-button"]').length > 0) {
				document.querySelectorAll('[id^="whiteboard-tool-close-"][id$="-button"]').forEach((toolCloseButton) => {
					toolCloseButton.onclick = (event) => {
						event.preventDefault();
						this.setTool(null, null, null, true);
					};
				});
			}
			if(document.querySelectorAll('[id^="whiteboard-tool-type-"][id$="-button"]').length > 0) {
				document.querySelectorAll('[id^="whiteboard-tool-type-"][id$="-button"]').forEach((toolTypeButton) => {
					toolTypeButton.onclick = (event) => {
						event.preventDefault();
						if(event.target.id.split('whiteboard-tool-type-')[1].split('-button')[0] == 'image') {
							this.html.imageInput.click();
						}
						else {
							this.setTool((this.tool.mode ? this.tool.mode : 'add'), event.target.id.split('whiteboard-tool-type-')[1].split('-button')[0], null, true);

							if(this.tool.mode == 'add') {
								this.html.toolPropertyFillButton.value = '#' + this.tool.fill[0] + this.tool.fill[0] + this.tool.fill[1] + this.tool.fill[1] + this.tool.fill[2] + this.tool.fill[2];
								this.html.toolPropertyFontFamilyButton.value = this.tool.fontFamily;
								this.html.toolPropertyFontSizeButton.value = this.tool.fontSize;
								this.html.toolPropertyLineWidthButton.value = this.tool.lineWidth;
								this.html.toolPropertyShapeTypeButton.value = this.tool.shapeType;
								this.html.toolPropertyTextAlignText.innerHTML = this.html.toolPropertyTextAlignButton.dataset['select' + this.tool.textAlign[0].toUpperCase() + this.tool.textAlign.slice(1) + 'Text'];
								this.html.toolPropertyTextAlignButton.value = this.tool.textAlign;
							}
						}
					};
				});
			}
			if(document.querySelectorAll('[id^="whiteboard-tool-property-"][id$="-button"]').length > 0) {
				document.querySelectorAll('[id^="whiteboard-tool-property-"][id$="-button"]').forEach((toolPropertyButton) => {
					toolPropertyButton.onclick = (event) => {
						if(event.target.id.includes('whiteboard-tool-property-') && event.target.id.includes('-button')) {
							switch(event.target.id.split('whiteboard-tool-property-')[1].split('-button')[0]) {
								case 'src': {
									this.html.imageInput.click();
									break;
								}
							}
						}
					};
				});
			}

			// Theme
			this.updateTheme();

			// Zoom events
			const zoom = {
				hold: false,
				interval: null
			};
			this.html.zoomIn.ontouchstart = this.html.zoomIn.onmousedown = (event) => {
				event.preventDefault();

				zoom.hold = true;
				this.engine.worker.postMessage(['changeZoomLevel', [1]]);
				zoom.interval = setInterval(() => {
					this.engine.worker.postMessage(['changeZoomLevel', [1]]);
				}, 250);
			};
			this.html.zoomRestore.onclick = (event) => {
				this.engine.worker.postMessage(['changeZoomLevel', [0]]);
			};
			this.html.zoomOut.ontouchstart = this.html.zoomOut.onmousedown = (event) => {
				event.preventDefault();

				zoom.hold = true;
				this.engine.worker.postMessage(['changeZoomLevel', [-1]]);
				zoom.interval = setInterval(() => {
					this.engine.worker.postMessage(['changeZoomLevel', [-1]]);
				}, 250);
			};
			this.html.zoomIn.ontouchend = this.html.zoomIn.onmouseup = this.html.zoomOut.ontouchend = this.html.zoomOut.onmouseup = (event) => {
				event.preventDefault();

				zoom.hold = false;
				clearInterval(zoom.interval);
			};
			this.html.control.onwheel = (event) => {
				event.preventDefault();

				if(event.deltaY < 0) {
					this.engine.worker.postMessage(['changeZoomLevel', [1]]);
				}
				else {
					this.engine.worker.postMessage(['changeZoomLevel', [-1]]);
				}
			};

			// Pointer events
			const pointer = {
				active: 0
			};
			this.html.control.ontouchstart = this.html.control.onmousedown = (event) => {
				if(event.type == 'touchstart') {
					if(event.touches.length == 1) {
						pointer.active = 1;
						this.engine.worker.postMessage(['onPointerDown', [event.touches[0].pageX, event.touches[0].pageY]]);
					}
					else if(event.touches.length == 2) {
						pointer.active = 2;
						this.engine.worker.postMessage(['onPointerDoubleDown', [event.touches[0].pageX, event.touches[0].pageY, event.touches[1].pageX, event.touches[1].pageY]]);
					}
				}
				else {
					pointer.active = 1;
					this.engine.worker.postMessage(['onPointerDown', [event.clientX, event.clientY]]);
				}
			};
			this.html.control.ontouchend = this.html.control.onmouseup = (event) => {
				pointer.active = 0;
				this.engine.worker.postMessage(['onPointerUp', []]);
			};
			this.html.control.ontouchmove = this.html.control.onmousemove = (event) => {
				event.preventDefault();

				if(pointer.active > 0) {
					if(event.type == 'touchmove') {
						if(event.touches.length == 1) {
							this.engine.worker.postMessage(['onPointerMove', [event.touches[0].pageX, event.touches[0].pageY]]);
						}
						else if(event.touches.length == 2) {
							this.engine.worker.postMessage(['onPointerDoubleMove', [event.touches[0].pageX, event.touches[0].pageY, event.touches[1].pageX, event.touches[1].pageY]]);
						}
					}
					else {
						this.engine.worker.postMessage(['onPointerMove', [event.clientX, event.clientY]]);
					}
				}
			};
		});

		// Global events - Resize
		window.addEventListener('resize', (event) => {
			this.resize();
		});

		// Global events - Online
		window.addEventListener('online', (event) => {
			// Access control
			this.accessControl();
		});

		// Global events - KeyDown
		window.addEventListener('keydown', (event) => {
			switch(event.code) {
				case 'KeyF': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.html.fullscreen.click();
					}
					break;
				}
				case 'KeyG': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.html.grid.click();
					}
					break;
				}
				case 'KeyT': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.html.theme.click();
					}
					break;
				}
				case 'NumpadAdd': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.engine.worker.postMessage(['changeZoomLevel', [1]]);
					}
					break;
				}
				case 'NumpadSubtract': {
					if(!event.target.hasAttribute('contenteditable')) {
						this.engine.worker.postMessage(['changeZoomLevel', [-1]]);
					}
					break;
				}
			}

			if(this.access.mode == 'edit') {
				switch(event.code) {
					case 'Delete': {
						if(!event.target.hasAttribute('contenteditable')) {
							this.engine.worker.postMessage(['deleteObject', []]);
							this.setTool(null, null, null, true);
						}
						break;
					}
					case 'Escape': {
						this.setTool(null, null, null, true);
						break;
					}
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
					if(this.hasAccessIdValidFormat()) {
						if(this.access.user) {
							// Signed in
							if(this.html.loading && this.html.login) {
								this.html.login.classList.add('o-login--hidden');
								this.html.loading.classList.remove('c-loading--hidden');
							}

							// Edit & view mode
							this.access.mode = this.access.current.pathname[0];
							this.access.id = this.access.current.pathname[1];
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
						throw Error('Invalid access id format!');
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
	hasAccessIdValidFormat() {
		if(this.access.current.pathname[1]) {
			// Access ID contains:
			// - characters of: [A-Z], [a-z], [0-9], '-', '_'
			// - length: 10
			const regExp = /^[A-Za-z0-9\-\_]{10}$/;
			return regExp.test(this.access.current.pathname[1]);
		} else { throw Error('Undefined access id!'); }
	}
	init() {
		if(this.access.permit) {
			if(!this.engine.worker) { this.engine.worker = new Worker('src/js/worker/engine.js'); }
			this.engine.worker.onmessage = (msg) => {
				if(msg.data.length == 2 && Array.isArray(msg.data[1])) {
					const iFn = msg.data[0];
					if(iFn) {
						if(this.engine.fn[iFn]) {
							const iArgs = msg.data[1];
							if(iArgs) {
								if(iArgs.length == this.engine.fn[iFn].length) {
									this.engine.fn[iFn].apply({}, (iArgs.length > 0 ? iArgs : []));
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
			this.resize();
			this.engine.worker.postMessage(['access', [
				this.access.mode,
				this.access.id,
				this.access.user.getAuthResponse().id_token
			]]);

			// LocalStorage
			if(this.html.grid && this.html.main && this.html.theme) {
				if(localStorage.getItem('grid') !== null) { this.setGrid(localStorage.getItem('grid')); }
				if(localStorage.getItem('theme') !== null) { this.setTheme(localStorage.getItem('theme')); }
			}
		}
	}
	resize() {
		if(this.engine.worker) {
			this.engine.worker.postMessage(['setWindowSize', [
				window.innerWidth,
				window.innerHeight
			]]);
		}
	}
	editNoteContent() {
		this.engine.worker.postMessage(['editNoteContent', [
			this.html.noteContent.scrollWidth,
			this.html.noteContent.scrollHeight,
			this.html.noteContent.innerHTML
		]]);
	}
	setTool(mode, type, property, sendToEngine=false) {
		if(type != this.tool.type) {
			const toolTypeButtons = document.querySelectorAll('.js-tool-type-button');
			const toolPropertyButtons = document.querySelectorAll('.js-tool-property-button');

			if(!type) {
				document.getElementById('whiteboard-tool-delete-button').classList.add('c-button--hidden');

				document.getElementById('whiteboard-tool-close-' + this.tool.type + '-button').classList.add('c-button--hidden');

				this.html.uploadSourceFileButton.classList.remove('c-button--hidden');

				toolTypeButtons.forEach((toolTypeButton) => {
					toolTypeButton.classList.remove('c-button--hidden');
				});

				toolPropertyButtons.forEach((toolPropertyButton) => {
					toolPropertyButton.classList.add('c-button--hidden');
					toolPropertyButton.classList.remove('o-shelf-first-item');
					toolPropertyButton.classList.remove('o-shelf-last-item');
					toolPropertyButton.classList.remove('o-shelf-first-item-text');
					toolPropertyButton.classList.remove('o-shelf-last-item-text');
				});
			}
			else {
				document.getElementById('whiteboard-tool-delete-button').classList.remove('c-button--hidden');

				document.getElementById('whiteboard-tool-close-' + type + '-button').classList.remove('c-button--hidden');

				this.html.uploadSourceFileButton.classList.add('c-button--hidden');

				toolTypeButtons.forEach((toolTypeButton) => {
					toolTypeButton.classList.add('c-button--hidden');
				});

				let i = 0;
				let lastToolPropertyButton;
				toolPropertyButtons.forEach((toolPropertyButton) => {
					if(!toolPropertyButton.hasAttribute('data-tool-type') || (toolPropertyButton.hasAttribute('data-tool-type') && toolPropertyButton.dataset.toolType.split(' ').includes(type))){
						toolPropertyButton.classList.remove('c-button--hidden');
						if(i == 0) {
							if(toolPropertyButton.classList.contains('o-shelf-item-text')) {
								toolPropertyButton.classList.add('o-shelf-first-item-text');
							}
							else {
								toolPropertyButton.classList.add('o-shelf-first-item');
							}
						}
						lastToolPropertyButton = toolPropertyButton;
						i++;
					}
				});
				if(lastToolPropertyButton.classList.contains('o-shelf-item-text')) {
					lastToolPropertyButton.classList.add('o-shelf-last-item-text');
				}
				else {
					lastToolPropertyButton.classList.add('o-shelf-last-item');
				}
			}
		}

		this.tool.mode = mode;
		this.tool.type = type;
		this.tool.property = property;

		if(sendToEngine) {
			this.engine.worker.postMessage(['setTool', [
				this.tool.mode,
				this.tool.type,
				this.tool.property
			]]);
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

			for(let i = 0; i < this.canvas.grid.objects.length; i++) {
				this.canvas.grid.objects[i].setLineColor(WHITEBOARD_THEME[this.theme].canvas.grid[i]);
			}

			for(let i = 0; i < this.canvas.main.objects.length; i++) {
				switch(this.canvas.main.objects[i].name) {
					case 'drawing': {
						this.canvas.main.objects[i].setLineColor(WHITEBOARD_THEME[this.theme].canvas.drawing.lineColor(this.canvas.main.objects[i].fill));
						break;
					}
					case 'note': {
						this.canvas.main.objects[i].setBackground(WHITEBOARD_THEME[this.theme].canvas.note.background(this.canvas.main.objects[i].fill));
						this.canvas.main.objects[i].setShadowColor(WHITEBOARD_THEME[this.theme].canvas.note.shadowColor);
						this.canvas.main.objects[i].setTextColor(WHITEBOARD_THEME[this.theme].canvas.note.textColor(this.canvas.main.objects[i].fill));
						break;
					}
					case 'image': {
						this.canvas.main.objects[i].setShadowColor(WHITEBOARD_THEME[this.theme].canvas.image.shadowColor);
						break;
					}
					case 'shape': {
						this.canvas.main.objects[i].setBackground(WHITEBOARD_THEME[this.theme].canvas.shape.background(this.canvas.main.objects[i].fill));
						this.canvas.main.objects[i].setShadowColor(WHITEBOARD_THEME[this.theme].canvas.shape.shadowColor);
						break;
					}
				}
			}

			this.canvas.redraw();

			if(this.html.toolPropertyFillButton) {
				this.engine.fn.styleNote(this.html.toolPropertyFillButton.value[1] + this.html.toolPropertyFillButton.value[3] + this.html.toolPropertyFillButton.value[5]);
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

		// Access control
		this.accessControl();
	}
	setGrid(grid) {
		if(grid == 'off') {
			this.grid = 'off';
			this.html.grid.setAttribute('title', this.html.grid.dataset.gridHalfTitle);
			this.html.grid.innerHTML = this.html.grid.dataset.gridHalfHtml;
		}
		else if(grid == 'half') {
			this.grid = 'half';
			this.html.grid.setAttribute('title', this.html.grid.dataset.gridFullTitle);
			this.html.grid.innerHTML = this.html.grid.dataset.gridFullHtml;
		}
		else {
			this.grid = 'full';
			this.html.grid.setAttribute('title', this.html.grid.dataset.gridOffTitle);
			this.html.grid.innerHTML = this.html.grid.dataset.gridOffHtml;
		}

		this.engine.worker.postMessage(['setGrid', [this.grid]]);
	}
	toggleGrid() {
		if(this.grid == 'full') { this.setGrid('off'); }
		else if(this.grid == 'off') { this.setGrid('half'); }
		else { this.setGrid('full'); }

		localStorage.setItem('grid', this.grid);
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
	toggleFullscreen(fullscreenButton, fullscreenTitle, fullscreenHtml, fullscreenExitTitle, fullscreenExitHtml) {
		const element = document.documentElement;

		const isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

		element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
		document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

		if(isFullscreen) {
			document.cancelFullScreen();
		}
		else {
			element.requestFullScreen();
		}

		element.onfullscreenchange = element.onfullscreenchange = element.onwebkitfullscreenchange = element.onmozfullscreenchange = (event) => {
			const isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

			if(isFullscreen) {
				fullscreenButton.setAttribute('title', fullscreenExitTitle);
				fullscreenButton.innerHTML = fullscreenExitHtml;
			}
			else {
				fullscreenButton.setAttribute('title', fullscreenTitle);
				fullscreenButton.innerHTML = fullscreenHtml;
			}
		};
	}
}

const whiteboard = new Whiteboard();

// Global functions
function onSignIn(user) {
	whiteboard.setUser(user);
}

function getColorFromFill(fill, pad=0) {
	const r = (parseInt(fill[0], 16) / 3 + pad).toString(16) + fill[0];
	const g = (parseInt(fill[1], 16) / 3 + pad).toString(16) + fill[1];
	const b = (parseInt(fill[2], 16) / 3 + pad).toString(16) + fill[2];
	return '#' + r + g + b;
}