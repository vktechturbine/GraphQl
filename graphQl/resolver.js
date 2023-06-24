import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Post from '../models/post.js';
import validator from 'validator';
import jwt from 'jsonwebtoken';

// import clearImage from '../utils/file.js';
import { initializeApp } from "firebase/app";
import { getStorage, ref, deleteObject } from "firebase/storage";
const firebaseConfig = {
    apiKey:process.env.FIREBASE_apiKey,
    authDomain: process.env.FIREBASE_authDomain,
    projectId: process.env.FIREBASE_projectId,
    storageBucket: process.env.FIREBASE_storageBucket,
    messagingSenderId:process.env.FIREBASE_messagingSenderId,
    appId: process.env.FIREBASE_appId,
    measurementId: process.env.FIREBASE_measurementId
};

initializeApp(firebaseConfig);
const storage = getStorage();
export const resolvers = {
    // resolvers: {
    Mutation: {
        createUser: async function (parent, { userInput }, contextValue, info) {

            const errors = [];

            if (!validator.isEmail(userInput.email)) {
                errors.push({ message: "please enter a valid email" });
            }
            if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
                errors.push({ message: "please enter a valid password" });
            }
            if (errors.length > 0) {
                const error = new Error('Invalid input');
                error.data = errors;
                error.code = 422;
                throw error;
            }
            const existingUser = await User.findOne({ email: userInput.email });
            if (existingUser) {
                const error = new Error("user is Already Exists");
                throw error;
            }

            const hashpw = await bcrypt.hash(userInput.password, 12)

            const user = new User({

                email: userInput.email,
                name: userInput.name,
                password: hashpw
            })

            const createdUser = await user.save();
            return { ...createdUser._doc, _id: createdUser._id.toString() }
        },
        createPost: async function (parent, { postInput }, context, info) {

            const errors = [];


            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            const user = await User.findOne({ _id: context.user.userId });

            if (!user) {
                const error = new Error('User Not Found');
                error.code = 401;
                throw error;
            }
            // console.log(info);
            if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
                errors.push({ message: 'invalid title' });
            }
            if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
                errors.push({ message: 'invalid content' });
            }

            if (errors.length > 0) {
                const error = new Error('Invalid Input');
                error.data = errors;
                error.code = 422;
                throw error;
            }
           
            console.log(postInput)
            const post = new Post({
                title: postInput.title,
                content: postInput.content,
                fileName: postInput.fileName,
                imageUrl: postInput.imageUrl,
                creator: user
            })
       

            const createdPost = await post.save();
    

            user.posts.push(createdPost);
            await user.save();
            return { ...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(), updatedAt: createdPost.updatedAt.toISOString() };
        },
        updatePost: async function (parent, { id, postInput }, context, info) {
          
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            const post = await Post.findOne({ _id: id }).populate('creator');
           
            if (!post) {
                const error = new Error("Post not Found");
                error.code = 404;
                throw error;
            }

            if (post.creator._id.toString() !== context.user.userId) {
                const error = new Error('Not Authorize');
                error.code = 403;
                throw error;
            }
            const errors = [];
            // console.log(request.userId);

            // console.log(info);
            if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
                errors.push({ message: 'invalid title' });
            }
            if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
                errors.push({ message: 'invalid content' });
            }

            if (errors.length > 0) {
                const error = new Error('Invalid Input');
                error.data = errors;
                error.code = 422;
                throw error;
            }
            post.title = postInput.title;
            post.content = postInput.content;

            if (postInput.imageUrl !== 'undefined') {
                post.fileName = postInput.fileName;
                post.imageUrl = postInput.imageUrl;
            }
            const updatePost = await post.save();

            return { ...updatePost._doc, _id: updatePost._id.toString(), createdAt: updatePost.createdAt.toISOString(), updatedAt: updatePost.updatedAt.toISOString() }

        },
        deletePost: async function (parent, { id }, context, info) {
        console.log("id : => "+id);
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            const post = await Post.findById(id);
           
            console.log(post);
            if (!post) {
                const error = new Error('Post not found');
                error.code = 422;
                throw error;
            }
           
            if (post.creator._id.toString() !== context.user.userId.toString()) {
                const error = new Error('Not Authorized');
                error.code = 403;
                throw error;

            }

            const deleteImagefromFirebase = ref(storage, post.fileName);

            deleteObject(deleteImagefromFirebase).then(() => {
                console.log("File Deleted Succcesssfully");
            }).catch(error => {
                console.log("File not Deleted Successfully");
            })
            await Post.deleteOne({_id:id});
            const user = await User.findOne({ _id: context.user.userId });
            user.posts.pull(id);
            await user.save();
            return true;

        },
        updateStatus: async function (parent, { status }, context, info) {
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            const user = await User.findById(context.user.userId);

            if (!user) {
                const error = new Error('User Not found');
                error.code = 404;
                throw error;
            }
            user.status = status;

            await user.save();

            return { ...user._doc, _id: user._id.toString() }
        }
    },
    Query: {
        login: async function (parent, { email, password }, context, info) {

            const user = await (User.findOne({ email: email }))
            if (!user) {
                const error = new Error("User not Found");
                error.code = 401;
                throw error;
            }
            const isEqual = await bcrypt.compare(password, user.password);
            if (!isEqual) {
                const error = new Error("Password is InCorrect");
                error.code = 422;
                throw error;
            }
            const token = jwt.sign({
                userId: user._id.toString(),
                email: user._email,
            }, 'somesupersecretsecret', { expiresIn: '1h' })

            return { token: token, userId: user._id.toString() };
        },
        posts: async function (parent, { page }, context, info) {
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            if (!page) {
                page = 1;
            }
            const perPage = 3;
            const totalPosts = await Post.find().countDocuments();
            const posts = await Post.find().sort({createdAt:'desc'}).skip((page - 1) * perPage).limit(perPage).populate('creator');
            console.log(posts);
            return {
                posts: posts.map(p => {
                    return { ...p._doc, _id: p._id.toString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }
                }), totalPost: totalPosts
            }
        },
        post: async function (parent, { id }, context, info) {
           
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }

            const post = await Post.findOne({ _id: id }).populate('creator');
            if (!post) {
                const error = new Error("Post not Found");
                error.code = 404;
                throw error;
            }
            
            return { ...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toString(), updatedAt: post.updatedAt.toString() }
        },
        user: async function (parent, args, context, info) {
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }
            const user = await User.findById(context.user.userId);
            if (!user) {
                const error = new Error('user Not found');
                error.code = 404;
                throw error;
            }
            return { ...user._doc, _id: user._id.toString() }
        }
    }
    /*  Query:{
         hello(){
             return {
                 text:"Hello World",
                 values:12345
             }
         }
     } */

    // }
}
export default resolvers;