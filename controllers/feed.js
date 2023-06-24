const fs = require('fs');
const path = require('path');
const io = require('../socket')
const {validationResult} = require('express-validator');
const User = require('../models/user');
const Post = require('../models/post');
const { request } = require('express');


exports.getPost = (request,response,next) => {
    const currentPage = request.query.page || 1;
    
    const perPage = 2;
    let totalItems;
    Post.find().countDocuments().sort({createdAt:-1}).then(count => {
        totalItems = count;
        return Post.find().skip((currentPage - 1) * perPage).limit(perPage);
    }).then((post) => {
        response.status(200).json({
            message:"Post Fetched SuccessFully",
            post:post,
            totalItems


         });
    }).catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    })
   
}
exports.createPost = (request,response,next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()){
        const error = new Error('validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    if(!request.file){
        const error = new Error("No Image Provided");
        error.statusCode = 422;
        throw error;
    }
    const title = request.body.title;
    const content = request.body.content;
    const imageUrl = request.file.path;
    let creator ;
    console.log("creator");
    console.log(creator);
    const post = new Post({
        title:title,
        content:content,  
        imageUrl:imageUrl,
        creator:request.userId,
    })

    post.save().then(result => {
        return User.findOne({_id:request.userId}) 
    }).then(user => {
        console.log(user);
        creator = user;
        user.posts.push(post);
        user.save();
        console.log("user.posts");
        console.log(user.posts);
        console.log("user.posts");
        io.getIO().emit('post',{action:'create',post:post});
        response.status(200).json({
            message:"Post Created Successfully",
            post:post,
            creator:{_id:creator._id,name:creator.name} 
        })
    }).catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    })
   
}
exports.getDetailPage = (request,response) => {
    const postId = request.params.postId;
    console.log(postId)
    Post.findOne({_id:postId}).then(result => {
        console.log(result)
        io.getIO().emit('post',{action:'delete',post:postId})
        response.status(200).json({
            message:"Single post View Successfully ",
            post:result
        })
    })
    
}

exports.editPost = (request,response,next) => {
    const postId = request.params.postId;
    const title = request.body.title;
    const content = request.body.content;
    let imageUrl = request.body.image;

    const errors = validationResult(request);
    if(!errors.isEmpty()){
        const error = new Error('validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    if(request.file){
        imageUrl = request.file.path;
    }
    if(!imageUrl){
        const error = new Error("Image Not Found");
        error.statusCode = 422;
        throw  error;
    }

    Post.findOne({_id:postId}).then(post => {
        console.log(post)
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        return post.save();
    }).then(posts => {
        if(!posts)
        {
            const error = new Error("post not found");
            error.statusCode = 422;
            throw error;
        }
        io.getIO().emit('post',{action :'update',post:posts});
        console.log(posts.creator.toString() !== request.userId);
        if(posts.creator.toString() !== request.userId )
        {
            const error =  new Error('Not Authorized');
            error.statusCode = 403;

        }
        if(imageUrl !== posts.imageUrl)
        {
            clearImage(posts.imageUrl);
        }
        response.status(200).json({
            message:"postUpdated SucessFullt",
            post:posts,
        })
    })
}
exports.deletePost = (request,response) => {
    const postId = request.params.postId;
    
    Post.deleteOne({_id:postId}).then(result => {
        /* if(result.creator.toString() !== request.userId )
        {
            const error =  new Error('Not Authorized');
            error.statusCode = 403;

        } */
         return User.findOne({_id:request.userId});
        
    }).then(user => {
        console.log(user);
        user.posts.pull(postId);
        console.log(user.posts);
        user.save();
        response.status(200).json({
            message:"Post Deleted Sucessfully"
        })
    })
}
const clearImage = filePath => {
    filePath = path.join(__dirname+'..'+filePath);
    fs.unlink(filePath,err => console.log(err));
}
