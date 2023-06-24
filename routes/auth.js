const express = require('express');
const User = require('../models/user');
const router = express.Router();
const {body} = require('express-validator');
const authController = require('../controllers/auth');


router.put('/signup',[
    body('email').isEmail().withMessage("Please Enter Valid Email").custom((value,{request}) => {
        return User.findOne({email:value}).then(userDoc => {
            if(userDoc)
            {
                return Promise.reject("User Already exist");
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min:5}),
    body('name').trim().not().isEmpty()
],authController.signup);
router.post('/login',authController.getLogin);
module.exports = router;