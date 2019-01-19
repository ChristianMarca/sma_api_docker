module.exports = class Coordenadas {
	constructor(latitud, longitud) {
		this.latitud = latitud;
		this.longitud = longitud;
	}

	coordenadasDecimales() {
		var stringCoordinates = `${this.latitud} ${this.longitud}`;
		const regex = /((?:[\+-]?[0-9]*[\.,][0-9]+)|(?:[\+-]?[0-9]+))|(?:[N n S s E e W w O o])/gm;
		// const str = ``;
		var coodinates = stringCoordinates.replace(/\s/g, '').match(regex);
		this.lat;
		this.long;
		if (coodinates.length === 2) {
			this.lat = coodinates[0];
			this.long = coodinates[1];
		} else {
			let lat =
				(Number(coodinates[0]) + Number(coodinates[1]) / 60 + Number(coodinates[2]) / 3600) *
				(coodinates.includes('S') || coodinates.includes('s') ? -1 : 1);
			let long =
				(Number(coodinates[4]) + Number(coodinates[5]) / 60 + Number(coodinates[6]) / 3600) *
				(coodinates.includes('W') ||
				coodinates.includes('O') ||
				coodinates.includes('w') ||
				coodinates.includes('o')
					? -1
					: 1);
			this.lat = lat;
			this.long = long;
		}
		return [ this.lat, this.long ];
	}
	coordenadasDMS() {
		return [ this.decimalDegrees2DMS(this.lat, 'Latitude'), this.decimalDegrees2DMS(this.long, 'Longitude') ];
	}
	sign(x) {
		return typeof x === 'number' ? (x ? (x < 0 ? -1 : 1) : x === x ? x : NaN) : NaN;
	}
	decimalDegrees2DMS(value, type) {
		value = Number(value);
		var degrees = Math.trunc(value);
		var submin = Math.abs((value - Math.trunc(value)) * 60);
		var minutes = Math.trunc(submin);
		var subseconds = Math.abs((submin - Math.trunc(submin)) * 60);
		var direction = '';
		if (type == 'Longitude') {
			if (degrees < 0) {
				direction = 'W';
			} else if (degrees > 0) {
				direction = 'E';
			} else if (degrees === 0) {
				if (Object.is(this.sign(degrees), 0)) {
					direction = 'E';
				} else {
					direction = 'W';
				}
			}
		} else if (type == 'Latitude') {
			if (degrees < 0) {
				direction = 'S';
			} else if (degrees > 0) {
				direction = 'N';
			} else if (degrees === 0) {
				if (Object.is(this.sign(degrees), 0)) {
					direction = 'N';
				} else {
					direction = 'S';
				}
			}
		}
		let notation = `${Math.abs(degrees)}\u00b0${minutes}'${subseconds.toFixed(2)}" ${direction}`;
		return notation;
	}
};
