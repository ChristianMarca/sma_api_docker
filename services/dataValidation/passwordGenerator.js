var crypto = require('crypto');

var self = module.exports;

var randomNumber = function(max) {
	var rand = crypto.randomBytes(1)[0];
	while (rand >= 256 - 256 % max) {
		rand = crypto.randomBytes(1)[0];
	}
	return rand % max;
};

var lowercase = 'abcdefghijklmnopqrstuvwxyz',
	uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	numbers = '0123456789',
	symbols = '!@#$%^&*()+_-=}{[]|:;"/?.><,`~',
	similarCharacters = /[ilLI|`oO0]/g,
	strictRules = [
		{ name: 'lowercase', rule: /[a-z]/ },
		{ name: 'uppercase', rule: /[A-Z]/ },
		{ name: 'numbers', rule: /[0-9]/ },
		{ name: 'symbols', rule: /[!@#$%^&*()+_\-=}{[\]|:;"/?.><,`~]/ }
	];

var generate = function(options, pool) {
	var password = '',
		optionsLength = options.length,
		poolLength = pool.length;

	for (var i = 0; i < optionsLength; i++) {
		password += pool[randomNumber(poolLength)];
	}

	if (options.strict) {
		var fitsRules = strictRules.reduce(function(result, rule) {
			if (result == false) return false;
			if (options[rule.name] == false) return result;
			return rule.rule.test(password);
		}, true);
		if (!fitsRules) return generate(options, pool);
	}

	return password;
};

self.generate = function(options) {
	options = options || {};
	if (!options.hasOwnProperty('length')) options.length = 10;
	if (!options.hasOwnProperty('numbers')) options.numbers = false;
	if (!options.hasOwnProperty('symbols')) options.symbols = false;
	if (!options.hasOwnProperty('exclude')) options.exclude = '';
	if (!options.hasOwnProperty('uppercase')) options.uppercase = true;
	if (!options.hasOwnProperty('excludeSimilarCharacters')) options.excludeSimilarCharacters = false;
	if (!options.hasOwnProperty('strict')) options.strict = false;

	if (options.strict) {
		var minStrictLength = 1 + (options.numbers ? 1 : 0) + (options.symbols ? 1 : 0) + (options.uppercase ? 1 : 0);
		if (minStrictLength > options.length) {
			throw new TypeError('Length must correlate with strict guidelines');
		}
	}

	var pool = lowercase;

	if (options.uppercase) {
		pool += uppercase;
	}
	if (options.numbers) {
		pool += numbers;
	}
	if (options.symbols) {
		pool += symbols;
	}
	if (options.excludeSimilarCharacters) {
		pool = pool.replace(similarCharacters, '');
	}
	var i = options.exclude.length;
	while (i--) {
		pool = pool.replace(options.exclude[i], '');
	}

	var password = generate(options, pool);

	return password;
};
self.generateMultiple = function(amount, options) {
	var passwords = [];

	for (var i = 0; i < amount; i++) {
		passwords[i] = self.generate(options);
	}

	return passwords;
};
