const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { loginUser, logoutUser, } = require('../auth');
const db = require('../db/models');
const { csrfProtection, asyncHandler } = require('./utils');
const { requireAuth } = require('../auth');

/*
const checkPermissions = (script, currentUser) => {
    if (script.userId !== currentUser.id) {
        const err = new Error('Illegal operation.');
        err.status = 403; // Forbidden
        throw err;
    }
};
*/

const router = express.Router();


//fetches group of responses
router.get('/edit/:id(\\d+)', requireAuth, csrfProtection,
    asyncHandler(async (req, res) => {
        const partId = parseInt(req.params.id, 10);
        const part = await db.Part.findByPk(partId);
        const idForScript = part.scriptId;
        const responses = await db.Response.findAll({ where: { partId: req.params.id }, order: [['id', 'DESC']] });
        const parts = await db.Part.findAll({ where: { scriptId: idForScript }, order: [['createdAt', 'ASC']] });

        res.render('response-edit', {
            responses,
            parts,
            partId,
            csrfToken: req.csrfToken(),
        });
    }));

const responseValidators = [
    check('body')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Body')
];


router.post('/add', requireAuth, csrfProtection, responseValidators,
    asyncHandler(async (req, res) => {
        const {
            body,
            partId,
            linkedPartId
        } = req.body;

        const response = db.Response.build({
            body,
            partId,
            linkedPartId
        });


        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await response.save();
            res.redirect(`/response/edit/${partId}`);
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('part-edit', {
                response,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.post('/update/:id(\\d+)', csrfProtection,
    asyncHandler(async (req, res) => {
        const responseId = parseInt(req.params.id, 10);
        const resposneToUpdate = await db.Response.findByPk(responseId);

        const {
            body,
            partId,
            linkedPartId
        } = req.body;

        const response = {
            body,
            partId,
            linkedPartId
        };

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await resposneToUpdate.update(response);
            res.redirect(`/response/edit/${partId}`);
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('part-edit', {
                response: { ...response, id: responseId },
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));


router.post('/delete/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
    const responseId = parseInt(req.params.id, 10);
    const response = await db.Response.findByPk(responseId);
    await response.destroy();
    res.redirect(`/response/edit/${response.partId}`);
}));


module.exports = router;