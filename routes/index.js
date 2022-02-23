const express = require('express');

const db = require('../db/models');
const { asyncHandler } = require('./utils');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
    res.redirect('/script/list');
}));




module.exports = router;