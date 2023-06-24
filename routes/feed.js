const express = require('express');

const router = express.Router();
const {body} = require('express-validator');
const isAuth = require('../middleware/is-auth');

const postData = require('../controllers/feed');

router.get('/post',isAuth,postData.getPost);

router.get('/post/:postId',postData.getDetailPage);

router.post('/createPost',isAuth,[
    body('title').trim().isLength({min:6}),
    body('content').trim().isLength({min:6})
],postData.createPost);

router.put('/post/:postId',isAuth,[body('title').trim().isLength({min:6}),
body('content').trim().isLength({min:6})
],postData.editPost);

router.get('/delete/:postId',isAuth,postData.deletePost);
module.exports = router;