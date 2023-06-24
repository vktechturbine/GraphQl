import {validationResult} from 'express-validator';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
exports.signup = (request,response,next) => {
    const error = validationResult(request);
    if(!error.isEmpty()) {
        const errors = new Error("Validation Falied");
        errors.statusCode = 422;
        errors.data = error.array();
        throw error;
    }
    const email = request.body.email;
    const password = request.body.password;
    const name = request.body.name;
    console.log(password);
    bcrypt.hash(password,12).then(hashpw => {
        console.log(hashpw);
        const user = new User({
            email: email,
            password:hashpw,
            name:name
        })
        console.log(user);
        return user.save();
    }).then(result => {
        console.log(result);
        response.status(200).json({
            message:"User Created Successfully",
            userId:result._id
        })
    }).catch(error => {
        if(!error.statusCode)
        {
            error.statusCode = 500;
        }
        next(error);

    })
}

exports.getLogin = (request,response) => {
    const email = request.body.email;
    const password = request.body.password;
    let loadUser;
    console.log(email);
    console.log(password);

    User.findOne({email:email}).then(user => {
        if(!user){
            const error  = "User not found";
            error.statusCode =  422;
            throw error;
        }
        loadUser = user;
        return bcrypt.compare(password,user.password);
    }).then((Equal) => {
        if(!Equal){
            const error = new Error("Password is not match");
            error.statusCode=422;
            throw error;
        }
        const token = jwt.sign({
            email:loadUser.email,
            userId:loadUser._id.toString(),
        },'supersecretsecret',
        {expiresIn:'1hr'}
        )
        response.status(200).json({
            token:token,userId:loadUser._id.toString()
        })
    }).catch(error => {
        console.log(error);
    })
    // User.findOne({email:email})
}