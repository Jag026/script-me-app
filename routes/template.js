const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { loginUser, logoutUser, } = require('../auth');
const db = require('../db/models');
const { csrfProtection, asyncHandler } = require('./utils');
const { requireAuth } = require('../auth');
const { response } = require('express');

const checkPermissions = (script, currentUser) => {
    if (script.userId !== currentUser.id) {
        const err = new Error('Illegal operation.');
        err.status = 403; // Forbidden
        throw err;
    }
};

const router = express.Router();

const cloneScript = asyncHandler(async (req, res, next) => {
    const scriptIdToCopy = parseInt(req.params.id, 10);
    const scriptToCopy = await db.Script.findAll({ where: { id: scriptIdToCopy } });

    //copies the template's script title
    const title = await scriptToCopy[0].title

    const script = await db.Script.build({
        userId: res.locals.user.id,
        title
    });
    await script.save();

    req.originalScriptId = scriptIdToCopy;
    req.newScriptId = await script.id
    next();
});



//clones the parts and responses for the new template
const cloneParts = asyncHandler(async (req, res, next) => {
    let originalPartIds = [];
    let newPartIds = [];

    //sets an array of parts using the scriptId
    const partsArr = await db.Part.findAll({ where: { scriptId: req.originalScriptId }, order: [['createdAt', 'ASC']] });

    await Promise.all(partsArr.map(async (part) => {
            const partObj = await db.Part.build({
                title: part.title,
                body: part.body,
                scriptId: req.newScriptId
            });
            await setTimeout(() => 1000);
            await partObj.save();
            await originalPartIds.push(part.id);
            await newPartIds.push(partObj.id);
        }));
    req.originalPartIds = originalPartIds;
    req.newPartIds = newPartIds;
    next();

});

const cloneResponses = asyncHandler(async (req, res, next) => {
    const originalPartIds = req.originalPartIds;
    const newPartIds = req.newPartIds;
    let partIndex = 0;

    await Promise.all(originalPartIds.map(async (partId) => {
        const responseArr = await db.Response.findAll({ where: { partId: partId }, order: [['createdAt', 'DESC']] });

        responseArr.forEach((response) => {
            //sets the newly cretaed response to link to appropriate part and 'linked part'
            const linkedPartIdForThisResponse = response.linkedPartId;
            const originalLinkedPartIdIndex = originalPartIds.findIndex(idx => idx === linkedPartIdForThisResponse);
            const newLinkedPartId = newPartIds[originalLinkedPartIdIndex];

            const newPartId = newPartIds[partIndex];
            const responseObj = db.Response.build({
                body: response.body,
                partId: newPartId,
                linkedPartId: newLinkedPartId,
            });
            responseObj.save();            
            
        });
        
        partIndex++;
    }));
    next();
});


router.get('/add/:id(\\d+)', csrfProtection, cloneScript, cloneParts, cloneResponses, asyncHandler(async (req, res) => {
    const scripts = await db.Script.findAll({ where: { userId: res.locals.user.id }, order: [['title', 'ASC']] });
    
    res.render('script-list', { scripts });
}));

router.get('/', csrfProtection, asyncHandler(async (req, res) => {
    const scripts = await db.Script.findAll({ where: { userId: 6 }, order: [['title', 'ASC']] });

    res.render('template-list', { scripts });
}));

router.get('/:id(\\d+)', csrfProtection,
    asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id, 10);
        const script = await db.Script.findByPk(id);
        //filters parts to match scriptId
        const parts = await db.Part.findAll({ where: { scriptId: id }, order: [['createdAt', 'ASC']] });
        const responses = await db.Response.findAll({ order: [['id', 'DESC']] });
        const firstPart = parts[0];

        res.render('script', {
            script,
            parts,
            responses,
            firstPart,
            csrfToken: req.csrfToken(),
        });
    }));

//delete db rows
/*
router.get('/delete/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
    const scripts = await db.Script.findAll({ where: { userId: res.locals.user.id }, order: [['title', 'ASC']] });
    const scriptId = parseInt(req.params.id, 10);
    const scriptsT = await db.Script.findAll({ where: { title: 'This is a test script' } });

    //const partId = parseInt(req.params.id, 10);
    //const part = await db.Part.findByPk(partId);
    await scriptsT.forEach((script) => {
        script.destroy();
    })
    res.render('script-list', { scripts });
}));
*/

module.exports = router;