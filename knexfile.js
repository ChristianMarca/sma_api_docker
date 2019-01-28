module.exports = {
	development: {
		client: 'pg',
		connection: process.env.POSTGRES_URI_LOCAL
	},
	production: {
		client: 'pg',
		connection: process.env.POSTGRES_URI
	}
};
