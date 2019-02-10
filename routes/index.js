const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
	res.status(200).json({ title: 'SMA_API', body: 'Ruta sin Asignar', estado: 'Conectado' });
});

module.exports = router;
