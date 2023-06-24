import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {Server} from 'socket.io';
//FireBase packages
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
// import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";


import turl from "turl";
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';




import { ApolloServer } from "@apollo/server";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
// import io from './socket.js';

/* import { ApolloServer } from '@apollo/server'; */
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './graphQl/schema.js'
import { resolvers } from './graphQl/resolver.js';
import jwt from 'jsonwebtoken';
import auth from './middleware/auth.js';
import cors from 'cors';
import clearImage from './utils/file.js';
// import { expressMiddleware } from '@apollo/server/express4';



const app = express();


const accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'),{flags:'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLog}));

//web app's Firebase configuration


const firebaseConfig = {
    apiKey: process.env.FIREBASE_apiKey,
    authDomain: process.env.FIREBASE_authDomain,
    projectId: process.env.FIREBASE_projectId,
    storageBucket: process.env.FIREBASE_storageBucket,
    messagingSenderId: process.env.FIREBASE_messagingSenderId,
    appId: process.env.FIREBASE_appId,
    measurementId: process.env.FIREBASE_measurementId
};

initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const storage = getStorage();

const httpServer = http.createServer(app);



const server = new ApolloServer({
    typeDefs, resolvers, plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], formatError(formattedError, error) {
        if (!error.originalError) {

            return error;
        }
        const data = error.originalError.data;
        const message = error.message || 'An error occurred';
        const code = error.originalError.code || 500;
        return {
            message: message,
            status: code,
            data: data
        }
    },
});
await server.start();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        console.log(file)
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, new Date().toISOString() + "-" + file.originalname);
    }
})



app.use(cors());
app.use(bodyParser.json());
// app.use(multer({ storage: fileStorage }).single('image'));
const upload = multer({ storage: multer.memoryStorage() })

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((request, response, next) => {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');
    if (request.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();

})
app.use(auth);
app.post('/post-image', upload.single('image'), async (request, response, next) => {


    if (request.isAuth === false) {
        const error = new Error('Not Authenticated');
        error.statusCode = 422;
        throw error;
    }

    console.log(request.file);
    if (!request.file) {
        return response.status(200).json({ message: "File Stored", filePath: request.body.oldPath, downloadUrl: request.body.oldUrl });
        // return res.status(200).json({ message: 'No File Provided' });
    }
    if (request.body.oldUrl) {
        console.log(request.body.oldUrl);
        const desRef = ref(storage, request.body.oldPath);
        deleteObject(desRef).then(() => {
            console.log("File Deleted Succcesssfully");
        }).catch(error => {
            console.log("File not Deleted Successfully");
        })
    }
    try {
        const dateTime = new Date();
        const storageRef = ref(storage, `files/${request.file.originalname + " " + dateTime}`);
        const metaData = {
            contentType: request.file.mimetype
        }



        const snapshot = await uploadBytesResumable(storageRef, request.file.buffer, metaData);

        const downloadUrl = await getDownloadURL(snapshot.ref);

        console.log("File Successfully uploaded");
        turl.shorten(downloadUrl).then((res) => {
            console.log(res);
            return response.status(200).json({ message: "File Stored", filePath: storageRef.fullPath, downloadUrl: res });
        }).catch((err) => {
            console.log(err);
        });

    } catch (e) {
        console.log(e);

    }


})
/* app.post('/post-image', (request, response, next) => {
    console.log("Hello") 
    console.log(request.isAuth);
    
    if(request.isAuth === false) {
        const error = new Error('Not Authenticated');
        error.statusCode = 422;
        throw error;
    }

    console.log(request.file);
    if (!request.file) {
        console.log("object")
        return response.status(200).json({ message: "File Stored", filePath: request.body.oldPath });
        // return res.status(200).json({ message: 'No File Provided' });
    }
     if (request.body.oldPath) {
        console.log(request.body.oldPath);
        clearImage(request.body.oldPath);
    }
    
    return response.status(200).json({ message: "File Stored", filePath: request.file.path });
}) */





app.use(
    '/graphql',
    cors(),
    bodyParser.json(),


    expressMiddleware(server, {
        context: async ({ req }) => {

            try {
                const token = req.headers.authorization;
                if (!token) {
                    return { user: null, isAuth: false };
                }
                const decode = jwt.verify(token.slice(7), 'somesupersecretsecret')
                return { user: decode, isAuth: true };
            } catch (error) {
                return { user: null, isAuth: false }
            }

        },
    }),
);


/* const { url } = startStandaloneServer(server, {
    listen: { port: 3002 },
    context: async ({ req, res }) => {
        console.log(req);
        try {
            const token = req.headers.authorization;
            if (!token) {
                return { user: null, isAuth: false };
            }
            const decode = jwt.verify(token.slice(7), 'somesupersecretsecret')
            return { user: decode, isAuth: true };
        } catch (error) {
            return { user: null, isAuth: false }
        }



        // console.log(req.headers.authorization)
        // if (req.headers.authorization) return { token: true }
        // token: await getTokenForRequest(req.get('Authorization')),

    }
}) */

app.use((error, request, response, next) => {

    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    response.status(status).json({ message: message, data: data });
    next();
})
/* 
   MONGO_USER : Vishalrk
   MONGO_PASSWORD:tech1mini
   MONGO_DB_NAME:shop
*/
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.y1iwedf.mongodb.net/${process.env.MONGO_DB_NAME}`).then(result => {


   
}).catch(error => {
    console.log(error);
})
// httpServer.listen(process.env.PORT || 3002);


await new Promise((resolve) => httpServer.listen({ port: process.env.PORT || 3002 }, resolve));



