const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { loginUser, logoutUser,  } = require('../auth');
const db = require('../db/models');
const { csrfProtection, asyncHandler } = require('./utils');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const scripts = await db.Script.findAll({ where: { userId: res.locals.user.id }, order: [['title', 'ASC']] });
    res.render('script-list', { scripts });
}));

router.get('/list', requireAuth, asyncHandler(async (req, res) => {
    const users = await db.User.findAll({ order: [['emailAddress', 'ASC']] });
    res.render('user-list', { users });
}));

router.get('/register', csrfProtection, (req, res) => {
    const user = db.User.build();
    res.render('user-register', {
        user,
        csrfToken: req.csrfToken(),
    });
});

const userValidators = [
    check('firstName')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for First Name')
        .isLength({ max: 50 })
        .withMessage('First Name must not be more than 50 characters long'),
    check('lastName')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Last Name')
        .isLength({ max: 50 })
        .withMessage('Last Name must not be more than 50 characters long'),
    check('emailAddress')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Email Address')
        .isLength({ max: 255 })
        .withMessage('Email Address must not be more than 255 characters long')
        .isEmail()
        .withMessage('Email Address is not a valid email')
        .custom((value) => {
            return db.User.findOne({ where: { emailAddress: value } })
                .then((user) => {
                    if (user) {
                        return Promise.reject('The provided Email Address is already in use by another account');
                    }
                });
        }),
    check('password')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Password')
        .isLength({ max: 50 })
        .withMessage('Password must not be more than 50 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, 'g')
        .withMessage('Password must contain at least 1 lowercase letter, uppercase letter, number, and special character (i.e. "!@#$%^&*")'),
    check('confirmPassword')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Confirm Password')
        .isLength({ max: 50 })
        .withMessage('Confirm Password must not be more than 50 characters long')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Confirm Password does not match Password');
            }
            return true;
        })
]

router.post('/register', csrfProtection, userValidators,
    asyncHandler(async (req, res) => {
        const {
            emailAddress,
            firstName,
            lastName,
            password,
        } = req.body;

        const user = db.User.build({
            emailAddress,
            firstName,
            lastName,
        });

        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.hashedPassword = hashedPassword;
            await user.save();
            loginUser(req, res, user);
            res.redirect('/user');
        } else {
            const errors = validatorErrors.array().map((error) => error.msg);
            res.render('user-register', {
                user,
                errors,
                csrfToken: req.csrfToken(),
            });
        }
    }));


router.get('/login', csrfProtection, (req, res) => {
    res.render('user-login', {
        csrfToken: req.csrfToken(),
    });
});

const loginValidators = [
    check('emailAddress')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Email Address'),
    check('password')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a value for Password'),
];

router.post('/login', csrfProtection, loginValidators,
    asyncHandler(async (req, res) => {
        const {
            emailAddress,
            password,
        } = req.body;

        let errors = [];
        const validatorErrors = validationResult(req);

        if (validatorErrors.isEmpty()) {
            // Attempt to get the user by their email address.
            const user = await db.User.findOne({ where: { emailAddress } });

            if (user !== null) {
                // If the user exists then compare their password
                // to the provided password.
                const passwordMatch = await bcrypt.compare(password, user.hashedPassword.toString());

                if (passwordMatch) {
                    // If the password hashes match, then login the user
                    // and redirect them to the default route.
                    // TODO Login the user.
                    loginUser(req, res, user);
                    return res.redirect('/user');
                }
            }

            // Otherwise display an error message to the user.
            errors.push('Login failed for the provided email address and password');
        } else {
            errors = validatorErrors.array().map((error) => error.msg);
        }

        res.render('user-login', {
            emailAddress,
            errors,
            csrfToken: req.csrfToken(),
        });
    }));


router.post('/logout', (req, res) => {
    logoutUser(req, res);
    res.redirect('/user/login');
});

router.get('/demo', csrfProtection,
    asyncHandler(async (req, res) => {
        const emailAddress = 'cb0f0f3c2f7af8ff86ae829cca676d8edd46e0f718d278237403b07960df08fa@fakeemail.com'
        const user = await db.User.findOne({ where: { emailAddress } });
        const password = 'Dumyypassword234523!'
        const passwordMatch = await bcrypt.compare(password, user.hashedPassword.toString());

        if (passwordMatch) {
            // If the password hashes match, then login the user
            // and redirect them to the default route.
            // TODO Login the user.
            loginUser(req, res, user);
            return res.redirect('/user');
        }
    }));


module.exports = router;