import jwt from 'jsonwebtoken';
import { User } from "./mongodb.js";


const auth = async (req, res, next) => {
    try{
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        const user = await  collection.findOne({_id: verifyUser._id});
        console.log(user);
        console.log(verifyUser);

        req.token = token;
        req.user = user;
        
        next();
    } catch(error) {
        res.status(401).send(error);
    }
}

export {auth};
