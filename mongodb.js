import mongoose, { model } from "mongoose";
import jwt from "jsonwebtoken";

mongoose.connect("mongodb://0.0.0.0:27017/credentialsdb")
.then(() =>{
    console.log("mongodb connected");
})
.catch((e)=>{
    console.log("failed to connect")
})

const LogInSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    employeeCode: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    periodOfEvaluation:{
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }]
});

const studentDevelopmentSchema = new mongoose.Schema({
    sd1: [{
        courseName: {
            type: String,
        },
        courseAttendance: {
            type: Number
        },
        subTotal1: {
            type: Number,
        }
    }],
    sd2: [{
        courseName: {
            type: String,
        },
        courseResult: {
            type: Number
        },
        subTotal2: {
            type: Number,
        }
    }]
});


const User = new mongoose.model("users", LogInSchema);

const studBucket = new mongoose.model("studBucket", studentDevelopmentSchema);

export { User, studBucket };
