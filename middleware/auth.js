import jwt from 'jsonwebtoken';

export const auth = (request,response,next) => {
    const authorization = request.get('Authorization');
    // const authorization = request.headers.authorization;
    console.log(authorization);
    if(!authorization){
       /*  const error = new Error('Invalid authorization');
        error.statusCode = 500;
        throw error; */
        request.isAuth = false;
        return next();
    }
    const token = authorization.split(' ')[1];
    let decodeToken;

    try{
        decodeToken = jwt.verify(token,'somesupersecretsecret');
                                        
    }catch(error){
        /* error.statusCode = 500;
        throw error; */
        request.isAuth = false;
        return next();
    }
    if(!decodeToken){
       /*  const error = new Error('Not Authenticated');
        error.statusCode=401;
        throw error; */
        request.isAuth = false;
        return next();
    }
    request.userId = decodeToken.userId;
    request.isAuth = true;
    // console.log(request.userId);
    next();
}

export default auth;