const express = require('express');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

const { loginUser, logoutUser, } = require('../auth');
const db = require('../db/models');
const { csrfProtection, asyncHandler } = require('./utils');
const { requireAuth } = require('../auth');

const checkPermissions = (script, currentUser) => {
    if (script.userId !== currentUser.id) {
        const err = new Error('Illegal operation.');
        err.status = 403; // Forbidden
        throw err;
    }
};

const router = express.Router();

router.get('/list', requireAuth, asyncHandler(async (req, res) => {
    const scripts = await db.Script.findAll({ where: { userId: res.locals.user.id }, order: [['title', 'ASC']] });
    res.render('script-list', { scripts });
}));


//fetches individual script
router.get('/:id(\\d+)', requireAuth, csrfProtection,
    asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id, 10);
        const script = await db.Script.findByPk(id);
        //filters parts to match scriptId
        const parts = await db.Part.findAll({ where: { scriptId: id }, order: [['createdAt', 'ASC']] });
        const responses = await db.Response.findAll({order: [['createdAt', 'ASC']] });
        const firstPart = parts[0];

        checkPermissions(script, res.locals.user);

        res.render('script', {
            script,
            parts,
            responses,
            firstPart,
            csrfToken: req.csrfToken(),
        });
    }));

const scriptValidators = [
    check('title')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Title')
        .isLength({ max: 250 })
        .withMessage('Title must not be more than 250 characters long'),
];

router.get('/add', requireAuth, csrfProtection, asyncHandler(async(req, res) => {
    const script = db.Script.build();
    
    res.render('script-add', {
        script,
        csrfToken: req.csrfToken(),
    });
}));


router.post('/add', requireAuth, csrfProtection, scriptValidators,
    asyncHandler(async (req, res) => {
        const {
            title
        } = req.body;

        const script = db.Script.build({
            userId: res.locals.user.id,
            title
        });

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await script.save();
            res.redirect('/user');
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('script-add', {
                script,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.get('/edit/:id(\\d+)', csrfProtection,
    asyncHandler(async (req, res) => {
        const scriptId = parseInt(req.params.id, 10);
        const script = await db.Script.findByPk(scriptId);

        checkPermissions(script, res.locals.user);

        res.render('script-edit', {
            script,
            csrfToken: req.csrfToken(),
        });
    }));

router.post('/edit/:id(\\d+)', csrfProtection, scriptValidators,
    asyncHandler(async (req, res) => {
        const scriptId = parseInt(req.params.id, 10);
        const scriptToUpdate = await db.Script.findByPk(scriptId);

        checkPermissions(scriptToUpdate, res.locals.user);

        const {
            title,
        } = req.body;

        const script = {
            title,
        };

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            await scriptToUpdate.update(script);
            res.redirect('/user');
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('script-edit', {
                script: { ...script, id: scriptId },
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));

router.get('/delete/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
    const scriptId = parseInt(req.params.id, 10);
    const script = await db.Script.findByPk(scriptId);
    checkPermissions(script, res.locals.user);
    res.render('script-delete', {
        script,
        csrfToken: req.csrfToken(),
    });
}));

router.post('/delete/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
    const scriptId = parseInt(req.params.id, 10);
    const script = await db.Script.findByPk(scriptId);
    checkPermissions(script, res.locals.user);
    await script.destroy();
    res.redirect('/user');
}));


module.exports = router;