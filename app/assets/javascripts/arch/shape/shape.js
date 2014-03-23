goog.provide('arch.shape.Shape');

goog.require('arch.array');
goog.require('arch.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.math.Coordinate');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {string} name
 * @param {string} url
 * @param {!goog.math.Coordinate} correctPosition
 * @param {!goog.math.Coordinate} size
 */
arch.shape.Shape = function(name, url, size, correctPosition) {
	goog.events.EventTarget.call(this);

	var self = this;

	/** @const */
	this.name = name;

	/** @const */
	this.url = url;

	/** @const */
	this.correctPosition = correctPosition;

	/** @const */
	this.size = size;

	/** @type {!goog.math.Coordinate} */
	this.position = new goog.math.Coordinate;

	/** @type {!Array.<arch.shape.Connection>} */
	this.connections = [];
};
goog.mixin(arch.shape.Shape.prototype, goog.events.EventTarget.prototype);

/**
 * @return {!goog.math.Coordinate}
 */
arch.shape.Shape.prototype.getPosition = function() {
	return this.position;
};

/**
 * @param {!goog.math.Coordinate} position
 */
arch.shape.Shape.prototype.setPosition = function(position) {
	this.position = position;
	this.fireListeners('position', false, null);
};

/**
 * @return {!goog.math.Coordinate}
 */
arch.shape.Shape.prototype.getCorrectOffset = function(shape) {
	return goog.math.Coordinate.difference(this.correctPosition, shape.correctPosition);
};

/**
 * @return {!goog.math.Coordinate}
 */
arch.shape.Shape.prototype.getOffset = function(shape) {
	return goog.math.Coordinate.difference(this.getPosition(), shape.getPosition());
};

/**
 * @param {!goog.math.Coordinate} position
 * @return {!goog.math.Coordinate}
 */
arch.shape.Shape.prototype.toAbsolute = function(position) {
	return goog.math.Coordinate.sum(this.getPosition(), position.clone().scale(this.size.x, this.size.y));
};

/**
 * @param {!arch.shape.Shape} shape
 */
arch.shape.Shape.prototype.snapTo = function(shape) {
	var position = goog.math.Coordinate.sum(shape.getPosition(), this.getCorrectOffset(shape));
	return this.setPosition(position);
};

/**
 * @return {arch.shape.Connection}
 */
arch.shape.Shape.prototype.closestConnection = function() {
	return arch.array.minElement(this.connections, function(connection) {
		return connection.getAccuracy();
	}) || null;
};

/**
 * @param {!goog.math.Coordinate} position
 * @return {boolean}
 */
arch.shape.Shape.prototype.hitTest = function(position) {
	var inBox = this.position.x <= position.x
		&& this.position.y <= position.y
		&& this.position.x + this.size.x >= position.x
		&& this.position.y + this.size.y >= position.y;
	if(inBox) {
		// start workaround for SVG hit test for Great Pyramid
		// TODO: find a better way
		var m;
		if(m = this.name.match(/bricks-(\d+)-(\d+)-([ab])/)) {
			var a = parseInt(m[1], 10);
			var b = parseInt(m[2], 10);
			var direction = m[3];
			var brickSize = this.size.x / (b - 1);

			var x = direction == 'a' ? position.x - this.position.x : this.position.x + this.size.x - position.x;
			var y = position.y - this.position.y;
			return x <= y + brickSize
				&& x >= y - (b - a) * brickSize - brickSize;
		} else if(m = this.name.match(/limestone-([ab])/)) {
			var direction = m[1];
			var brickSize = this.size.x / 45;

			var x = direction == 'a' ? position.x - this.position.x : this.position.x + this.size.x - position.x;
			var y = position.y - this.position.y;
			return Math.abs(x - y) < brickSize * 3;
		}
		// end workaround
		return true;
	}
	return false;
};
