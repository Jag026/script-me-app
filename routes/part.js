const express = require('express');
// const bcrypt = require('bcryptjs');
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

//fetches individual part
router.get('/:id(\\d+)', requireAuth, csrfProtection,
    asyncHandler(async (req, res) => {
        const partId = parseInt(req.params.id, 10);
        const part = await db.Part.findByPk(partId);
        const responses = await db.Response.findAll({ where: { id: req.params.id }, order: [['createdAt', 'ASC']] });
        res.render('part-edit', {
            partId,
            part,
            responses,
            csrfToken: req.csrfToken(),
        });
    }));

router.get('/:id(\\d+)/preview', requireAuth, csrfProtection,
    asyncHandler(async (req, res) => {
        const idForPart = parseInt(req.params.id, 10);
        const part = await db.Part.findByPk(idForPart);
        const responses = await db.Response.findAll({ where: { partId: idForPart }, order: [['createdAt', 'ASC']] });
        res.render('preview-part', {
            idForPart,
            part,
            responses,
            csrfToken: req.csrfToken(),
        });
    }));

const partValidators = [
    check('title')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Title')
        .isLength({ max: 250 })
        .withMessage('Title must not be more than 250 characters long'),
    check('body')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Body')
];

// no get router for add-part, it's created directly on script
router.post('/add', requireAuth, csrfProtection, partValidators,
    asyncHandler(async (req, res) => {
        const {
            title,
            body,
            scriptId
        } = req.body;

        const part = db.Part.build({
            title,
            body,
            scriptId
        });

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await part.save();
            res.redirect(`/script/${scriptId}`);
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('script-add', {
                part,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.get('/edit/:id(\\d+)', csrfProtection,
    asyncHandler(async (req, res) => {
        const partId = parseInt(req.params.id, 10);
        const id = partId
        const part = await db.Part.findByPk(partId);
        const responses = await db.Response.findAll({ where: { partId: id}, order: [['createdAt', 'ASC']] });

        res.render('part-edit', {
            part,
            responses,
            csrfToken: req.csrfToken(),
        });
    }));

router.post('/edit/:id(\\d+)', csrfProtection, partValidators,
    asyncHandler(async (req, res) => {
        const partId = parseInt(req.params.id, 10);
        const partToUpdate = await db.Part.findByPk(partId);

        const {
            title,
            body,
            returnScriptId
        } = req.body;

        const part = {
            title,
            body,
            returnScriptId
        };

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await partToUpdate.update(part);
            res.redirect(`/script/${returnScriptId}`);
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('part-edit', {
                part: { ...part, id: partId },
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.post('/delete/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
    const {
        returnScriptId,
    } = req.body;

    const id = {
        returnScriptId,
    };
    const partId = parseInt(req.params.id, 10);
    const part = await db.Part.findByPk(partId);
    await part.destroy();
    res.redirect(`/script/${id.returnScriptId}`);
}));


module.exports = router;