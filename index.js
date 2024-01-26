import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { createConnection } from 'mongoose';
import multer from 'multer';
import path from 'path';
import pdf from 'html-pdf';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000 // Set the session duration to 1 hour (in milliseconds)
  }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB")
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads/');
    cb(null, uploadPath); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const userSchema = new mongoose.Schema({
  name: {
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
  periodOfEvaluation: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'ro', 'faculty'],
    required: true
  }
});

const studentDevelopmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  reviewerScore1:{
    type: Number
  },
  sd1: [{
      courseName: {
        type: String,
      },
      courseAttendance: {
        type: Number
      },
      subTotal1: {
        type: Number,
        required: true
      },
      file: {
        filename: String,
        filepath: String,
      }
  }],
  comments1: [{
    author: String, 
    content: String, 
    role: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  avgSelfAppraisalScore1:{
    type: Number
  },
  sd2: [{
    courseName: {
      type: String
    },
    courseResult: {
      type: Number
    },
    subTotal2: {
      type: Number,
      required: true
    },
    file: {
      filename: String,
      filepath: String,
    }
  }],
  comments2: [{
    author: String, 
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  avgSelfAppraisalScore2:{
    type: Number
  },
  reviewScore2:{
    type: Number
  },
  sd3: [{
    courseName: {
      type: String
    }, 
    noOfStudents100per: {
      type: Number
    },
    noOfStudents90To99per: {
      type: Number
    },
    noOfStudents80To89per: {
      type: Number
    },
    noOfStudents70To79per: {
      type: Number
    },
    noOfStudents60To69per: {
      type: Number
    },
    noOfStudentsBelow60per: {
      type: Number
    },
    subTotal3: {
      type:Number,
      required: true
    },
    file: {
      filename: String,
      filepath: String,
    }
  }],
  comments3: [{
    author: String, 
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  avgSelfAppraisalScore3:{
    type: Number
  },
  reviewScore3:{
    type: Number
  },
  sd4: [{
    courseName: {
      type: String
    },
    courseAttendance:{
      type: Number
    },
    studentFeedBack: {
      type: Number
    },
    subTotal4: {
      type: Number,
      required: true
    },
    file: {
      filename: String,
      filepath: String,
    }
  }],
  comments4: [{
    author: String, 
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  avgSelfAppraisalScore4:{
    type: Number
  },
  reviewScore4:{
    type: Number
  },
  sd5: [{
    noOfMeetings: {
      type: Number
    },
    awardsWon: {
      type: Number
    },
    professionalAndPersonalDevelopmentOfMentee: {
      type: Array
    },
    feedBack: {
      type: Number
    },
    file: {
      filename: String,
      filepath: String,
    }
  }],
  comments5: [{
    author: String, 
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  avgSelfAppraisalScore5:{
    type: Number
  },
  reviewScore5:{
    type: Number
  },
  totalSelfAppraisalScore: {
    type: Number
  },
  totalReviewerScore: {
    type: Number
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const studBucket = new mongoose.model("studBucket", studentDevelopmentSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});


app.get("/", (req, res) => {
  res.render("signin");
});

app.get("/signup", (req, res) => {
  res.render("register");
});

app.get("/index", (req, res) => {
  res.render("index",  {name: req.user.name, email: req.user.username});
});

app.get("/studBucket1", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd1 && userDocument.sd1.length > 0) {
      const sd1Data = userDocument.sd1[0];
      res.render("studBucket1", { user: req.user, sd1Data, name: req.user.name, email: req.user.email });
    } else {
      res.render("studBucket1", { user: req.user, sd1Data: null, name: req.user.name, email: req.user.email });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/studBucket2", (req, res) => {
  res.render("studBucket2", {name: req.user.name, email: req.user.username})
});

app.get("/studBucket3", (req, res) => {
  res.render("studBucket3",{name: req.user.name, email: req.user.username})
});

app.get("/studBucket4", (req, res) => {
  res.render("studBucket4",{name: req.user.name, email: req.user.username});
});

app.get("/studBucket5", (req, res) => {
  res.render("studBucket5");
});


app.get("/profile", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd1 && userDocument.sd1.length > 0) {
      const sd1Data = userDocument.sd1;
      res.render("profile", { user: req.user, sd1Data, name: req.user.name, email: req.user.email, department: req.user.department, designation: req.user.designation, employeeCode: req.user.employeeCode });
    } else {
      res.render("profile", { user: req.user, sd1Data: null, name: req.user.name, email: req.user.email, department: req.user.department, designation: req.user.designation, employeeCode: req.user.employeeCode });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/profile/studentBuckets", (req, res) => {
  res.render("facultySubmittedStudentB",  {name: req.user.name, email: req.user.username});
});

app.get("/profile/reportDownload", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    const data = {
      users: userDocument,
      name: req.user.name
    }
    const filePathName = path.resolve(__dirname,'./views/htmlTopdf.ejs');
    const htmlString = fs.readFileSync(filePathName).toString();
    let options = {
      format: 'A4'
    }
    const ejsData = ejs.render(htmlString, data);
    pdf.create(ejsData, options).toFile('report.pdf', (error, response) => {
      if(error) console.log(err);

      const filePath = path.resolve(__dirname, './report.pdf');

      fs.readFile(filePath, (err, file) => {
        if(err){
          console.log(err);
          res.status(500).send('Could not Download fle');
        }

        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','attachment;filename="report.pdf"');
        res.send(file);
      })

      console.log("file generated");
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/profile/studentBuckets/forms1", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd1 && userDocument.sd1.length > 0) {
      res.render("facultySubmittedForms1", { user: req.user, name: req.user.name, email: req.user.username, sd1: userDocument.sd1 ,avgSelfAppraisalScore1: userDocument.avgSelfAppraisalScore1, reviewerScore1: userDocument.reviewerScore1, comments1: userDocument.comments1});
    } else {
      res.render("facultySubmittedForms1", { user: req.user, name: req.user.name, email: req.user.username, sd1: null ,avgSelfAppraisalScore1: userDocument.avgSelfAppraisalScore1, reviewerScore1: userDocument.reviewerScore1, comments1: userDocument.comments1});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/profile/studentBuckets/forms2", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd2 && userDocument.sd2.length > 0) {
      res.render("facultySubmittedForms2", { user: req.user, name: req.user.name, email: req.user.username, sd2: userDocument.sd2 ,avgSelfAppraisalScore2: userDocument.avgSelfAppraisalScore2, reviewerScore2: userDocument.reviewerScore2, comments2: userDocument.comments2});
    } else {
      res.render("facultySubmittedForms2", { user: req.user, name: req.user.name, email: req.user.username, sd2: null ,avgSelfAppraisalScore2: userDocument.avgSelfAppraisalScore2, reviewerScore2: userDocument.reviewerScore2, comments2: userDocument.comments2});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/profile/studentBuckets/forms3", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd3 && userDocument.sd3.length > 0) {
      res.render("facultySubmittedForms3", { user: req.user, name: req.user.name, email: req.user.username, sd3: userDocument.sd3 ,avgSelfAppraisalScore3: userDocument.avgSelfAppraisalScore3, reviewerScore3: userDocument.reviewerScore3, comments3: userDocument.comments3});
    } else {
      res.render("facultySubmittedForms3", { user: req.user, name: req.user.name, email: req.user.username, sd3: null ,avgSelfAppraisalScore3: userDocument.avgSelfAppraisalScore3, reviewerScore3: userDocument.reviewerScore3, comments3: userDocument.comments3});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/profile/studentBuckets/forms4", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd4 && userDocument.sd4.length > 0) {
      res.render("facultySubmittedForms4", { user: req.user, name: req.user.name, email: req.user.username, sd4: userDocument.sd4 ,avgSelfAppraisalScore4: userDocument.avgSelfAppraisalScore4, reviewerScore4: userDocument.reviewerScore4, comments4: userDocument.comments4});
    } else {
      res.render("facultySubmittedForms4", { user: req.user, name: req.user.name, email: req.user.username, sd4: null ,avgSelfAppraisalScore4: userDocument.avgSelfAppraisalScore4, reviewerScore4: userDocument.reviewerScore4, comments4: userDocument.comments4});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/profile/studentBuckets/forms5", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });

    if (userDocument && userDocument.sd5 && userDocument.sd5.length > 0) {
      res.render("facultySubmittedForms5", { user: req.user, name: req.user.name, email: req.user.username, sd5: userDocument.sd5 ,avgSelfAppraisalScore5: userDocument.avgSelfAppraisalScore5, reviewerScore5: userDocument.reviewerScore5, comments5: userDocument.comments5});
    } else {
      res.render("facultySubmittedForms5", { user: req.user, name: req.user.name, email: req.user.username, sd5: null ,avgSelfAppraisalScore5: userDocument.avgSelfAppraisalScore5, reviewerScore5: userDocument.reviewerScore5, comments5: userDocument.comments5});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/profile/studentBuckets/forms1/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments1: {
            author: req.body.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect("/profile/studentBuckets/forms1");
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/profile/studentBuckets/forms2/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments2: {
            author: req.user.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect("/profile/studentBuckets/forms2");
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post("/profile/studentBuckets/forms3/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments3: {
            author: req.body.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect("/profile/studentBuckets/forms3");
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post("/profile/studentBuckets/forms4/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments4: {
            author: req.body.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect("/profile/studentBuckets/forms4");
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post("/profile/studentBuckets/forms5/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments5: {
            author: req.body.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect("/profile/studentBuckets/forms5");
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

function checkRole(role) {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    }
    res.redirect("/"); 
  };
}

app.get("/approve", checkRole('ro'), async (req, res) => {
  try {
    if (req.isAuthenticated() && req.user.role === 'ro') {
      const roDepartment = req.user.department;

      const facultyMembers = await User.find({ role: 'faculty', department: roDepartment });

      res.render("approve", { facultyMembers, name: req.user.name, email: req.user.username, department: req.user.department, designation: req.user.designation });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/approve/StudentBucket/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('SubmittedstudentBuckets', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedBuckets/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedBuckets', { user , name: req.user.name, email: req.user.username});
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedformsSD1/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedForms', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedformsSD2/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedForms2', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedformsSD3/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedForms3', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedformsSD4/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedForms4', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/approve/submittedformsSD3/:name", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const user = await studBucket.findOne({ name });

    if (user) {
      res.render('submittedForms3', { user, name: req.user.name, email: req.user.username });
    } else {
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post("/approve/submittedformsSD1/:name/comment", checkRole('ro'), async (req, res) => {
  try {
    const { name } = req.params;
    const {commentText} = req.body;
    const user = await studBucket.findOne({ name });
    const updateResult = await studBucket.updateOne(
      { name: name },
      {
        $push: {
          comments1: {
            author: req.user.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    console.log('Update result:', updateResult);

    if (updateResult.matchedCount > 0) {
      res.redirect(`/approve/submittedformsSD1/${name}`);
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/approve/submittedformsSD2/:name/comment", checkRole('ro'), async (req, res) => {
  try {
    const { name } = req.params;
    const {commentText} = req.body;
    const user = await studBucket.findOne({ name });
    const updateResult = await studBucket.updateOne(
      { name: name },
      {
        $push: {
          comments2: {
            author: req.user.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );


    if (updateResult.matchedCount > 0) {
      res.redirect(`/approve/submittedformsSD2/${name}`);
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/approve/submittedformsSD3/:name/comment", checkRole('ro'), async (req, res) => {
  try {
    const { name } = req.params;
    const {commentText} = req.body;
    const user = await studBucket.findOne({ name });
    const updateResult = await studBucket.updateOne(
      { name: name },
      {
        $push: {
          comments3: {
            author: req.user.name, 
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    if (updateResult.matchedCount > 0) {
      res.redirect(`/approve/submittedformsSD3/${name}`);
    } else {
      res.status(404).send('Document not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/evidence/:name/:filename", checkRole('ro'),(req, res) => {
  const { name, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  res.sendFile(filePath);
});


app.post("/approve/submittedFormsSD1/:name/save", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const reviewerScoreValue = parseFloat(req.body.reviewerScore1);

    if (isNaN(reviewerScoreValue)) {
      return res.status(400).send('Invalid reviewer score value');
    }

    let userDocument = await studBucket.findOne({ name: name });

    if (!userDocument) {
      userDocument = await studBucket.create({ name: name });
    }

    if (userDocument.reviewerScore1 === undefined) {
      const createReviewerScoreResult = await studBucket.updateOne(
        { name: name },
        {
          $set: {
            reviewerScore1: reviewerScoreValue,
          },
        }
      );
    } else {
      const updateReviewerScoreResult = await studBucket.updateOne(
        { name: name },
        {
          $set: {
            reviewerScore1: reviewerScoreValue,
          },
        }
      );
    }

    res.status(200).redirect(`/approve/submittedFormsS1/${name}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post("/approve/submittedFormsSD2/:name/save", checkRole('ro'),async (req, res) => {
  try {
    const { name } = req.params;
    const reviewerScoreValue = parseFloat(req.body.reviewerScore2);

    if (isNaN(reviewerScoreValue)) {
      return res.status(400).send('Invalid reviewer score value');
    }

    let userDocument = await studBucket.findOne({ name: name });

    if (!userDocument) {
      userDocument = await studBucket.create({ name: name });
    }

    if (userDocument.reviewerScore2 === undefined) {
      const createReviewerScoreResult = await studBucket.updateOne(
        { name: name },
        {
          $set: {
            reviewerScore2: reviewerScoreValue,
          },
        }
      );
    } else {
      const updateReviewerScoreResult = await studBucket.updateOne(
        { name: name },
        {
          $set: {
            reviewerScore2: reviewerScoreValue,
          },
        }
      );
    }

    res.status(200).redirect(`/approve/submittedFormsSD2/${name}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

app.get("/ro-home", checkRole('ro'), (req, res) => {
  res.render("ro-home", { name: req.user.name, email: req.user.username });
});

app.get("/approve", checkRole('ro'), async (req, res) => {
  try {
    if (req.isAuthenticated() && req.user.role === 'ro') {
      const roDepartment = req.user.department;

      const facultyMembers = await User.find({ role: 'faculty', department: roDepartment });

      res.render("approve", { facultyMembers, name: req.user.name, email: req.user.username });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/signup", (req, res) => {
  const newUser = new User({
    username: req.body.username,
    name: req.body.name,
    employeeCode: req.body.employeeCode,
    department: req.body.department,
    designation: req.body.designation,
    periodOfEvaluation: req.body.periodOfEvaluation,
    role: req.body.userType === '1' ? 'admin' : req.body.userType === '2' ? 'ro' : 'faculty',
  });

  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.error("Registration error:", err.message);
      return res.redirect("/signup" );  
    }

    passport.authenticate("local")(req, res, function () {
      res.redirect("/");
    });
  });
});

app.post("/signin", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        const redirectUrl = req.user.role === 'admin' ? '/index' :
                            req.user.role === 'ro' ? '/ro-home' :
                            '/index';
        res.redirect(redirectUrl);
      });
    }
  });

});


app.post("/save1", upload.single('file'), async (req, res) => {
  try {
    if (req.isAuthenticated() && req.user && req.user.username) {
      const courseAttendance = parseFloat(req.body.courseAttendance);
      const file = req.file;

      if (isNaN(courseAttendance)) {
        return res.status(400).send("Invalid attendance value");
      }

      let attendance = 0;
      if (courseAttendance >= 80) {
        attendance = 300;
      } else if (courseAttendance >= 70 && courseAttendance < 80) {
        attendance = 225;
      } else if (courseAttendance >= 60 && courseAttendance < 70) {
        attendance = 150;
      } else if (courseAttendance >= 50 && courseAttendance < 60) {
        attendance = 105;
      } else if (courseAttendance >= 40 && courseAttendance < 50) {
        attendance = 70;
      } else {
        attendance = 0;
      }

      let userDocument = await studBucket.findOne({ name: req.user.username });

      if (!userDocument) {
        userDocument = await studBucket.create({ name: req.user.username });
      }

      if (!userDocument.sd1) {
        userDocument.sd1 = [];
      }

      if (file) {
        const updateResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $push: {
              sd1: {
                courseName: req.body.courseName,
                courseAttendance: courseAttendance,
                subTotal1: attendance,
                file: {
                  filename: file.filename,
                  filepath: file.path,
                },
              },
            },
          }
        );

        let avgSubTotal1 = 0;

      if (userDocument.sd1.length > 0) {
        avgSubTotal1 = userDocument.sd1.reduce((total, sd) => total + sd.subTotal1, 0) / userDocument.sd1.length;
      }

        const updateAvgScoreResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $set: {
              avgSelfAppraisalScore1: avgSubTotal1,
            },
          }
        );

      let total = userDocument.totalSelfAppraisalScore || 0;

      // Add avgSelfAppraisalScore1 to total
      total += userDocument.avgSelfAppraisalScore1 || 0;

      // Update totalSelfAppraisalScore in the document
      const updateTotalScoreResult = await studBucket.updateOne(
        { name: req.user.username },
        { $set: { totalSelfAppraisalScore: total } }
      );

        return res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket1'; clearSelectTags();</script>");
      } else {
        res.status(500).send("file not found");
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error in /save1 route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/save2", upload.single('file'), async (req, res) => {
  try {
    if (req.isAuthenticated() && req.user && req.user.username) {
      const courseResult = parseFloat(req.body.courseResult);
      const file = req.file;

      if (isNaN(courseResult)) {
        return res.status(400).send("Invalid attendance value");
      }

      let result = 0;

      if (courseResult === 100) {
        result = 700;
      } else if (courseResult >= 90) {
        result = 590;
      } else if (courseResult >= 80) {
        result = 470;
      } else if (courseResult >= 70) {
        result = 350;
      } else if (courseResult >= 60) {
        result = 240;
      } else {
        result = 0;
      }
      let userDocument = await studBucket.findOne({ name: req.user.username });

      if (!userDocument) {
        userDocument = await studBucket.create({ name: req.user.username });
      }

      if (!userDocument.sd2) {
        userDocument.sd2 = [];
      }

      if (file) {
        const updateResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $push: {
              sd2: {
                courseName: req.body.courseName,
                courseResult: courseResult,
                subTotal1: result,
                file: {
                  filename: file.filename,
                  filepath: file.path,
                },
              },
            },
          }
        );

        let avgSubTotal2 = 0;

      if (userDocument.sd2.length > 0) {
        avgSubTotal2 = userDocument.sd2.reduce((total, sd) => total + sd.subTotal2, 0) / userDocument.sd2.length;
      }

        const updateAvgScoreResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $set: {
              avgSelfAppraisalScore2: avgSubTotal2,
            },
          }
        );

      let total = userDocument.totalSelfAppraisalScore || 0;

      // Add avgSelfAppraisalScore1 to total
      total += userDocument.avgSelfAppraisalScore2 || 0;

      // Update totalSelfAppraisalScore in the document
      const updateTotalScoreResult = await studBucket.updateOne(
        { name: req.user.username },
        { $set: { totalSelfAppraisalScore: total } }
      );

        return res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket2'; clearSelectTags();</script>");
      } else {
        res.status(500).send("file not found");
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error in /save2 route:", error);
    res.status(500).send("Internal Server Error");
  }
});



app.post("/save3", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user.username);
    const file = req.file;

    const students100 = parseFloat(req.body.noOfStudents100per) * 20 ;
    
    const students90_99 = parseFloat(req.body.noOfStudents90To99per) * 15;

    const students80_89 = parseFloat(req.body.noOfStudents80To89per) * 10;

    const students70_79 = parseFloat(req.body.noOfStudents70To79per) * 7;

    const students60_69  = parseFloat(req.body.noOfStudents60To69per) * 5;

    const studentsBelow60 = parseFloat(req.body.noOfStudentsBelow60per) * 0;

    const total = students100 + students90_99 + students80_89 + students70_79 + students60_69 + studentsBelow60;

    try {

      
      let userDocument = await studBucket.findOne({ name: req.user.username });

      if (!userDocument) {
        userDocument = await studBucket.create({ name: req.user.username });
      }

      if (!userDocument.sd3) {
        userDocument.sd3 = [];
      }

      if (file) {
        const updateResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $push: {
              sd3: {
                courseName: req.body.courseName,
                noOfStudents100per: req.body.noOfStudents100per,
                noOfStudents90To99per: req.body.noOfStudents90To99per,
                noOfStudents80To89per: req.body.noOfStudents80To89per,
                noOfStudents70To79per: req.body.noOfStudents70To79per,
                noOfStudents60To69per: req.body.noOfStudents60To69per,
                noOfStudentsBelow60per: req.body.noOfStudentsBelow60per,
                subTotal3: total,
                file: {
                  filename: file.filename,
                  filepath: file.path,
                },
              },
            },
          }
        );

        let avgSubTotal3 = 0;
      if (userDocument.sd3.length > 0) {
        avgSubTotal3 = userDocument.sd3.reduce((total, sd) => total + sd.subTotal3, 0) / userDocument.sd3.length;
      }

        const updateAvgScoreResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $set: {
              avgSelfAppraisalScore3: avgSubTotal3,
            },
          }
        );

      let total = userDocument.totalSelfAppraisalScore || 0;

      // Add avgSelfAppraisalScore1 to total
      total += userDocument.avgSelfAppraisalScore3 || 0;

      // Update totalSelfAppraisalScore in the document
      const updateTotalScoreResult = await studBucket.updateOne(
        { name: req.user.username },
        { $set: { totalSelfAppraisalScore: total } }
      );

        return res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket1'; clearSelectTags();</script>");
      } else {
        res.status(500).send("file not found");
      }
  } catch (error) {
      console.error(error);
  }
  } else {
    res.redirect("/");
  }
});


app.post("/save4", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      console.log(req.user.username);

      const sFeedback = parseFloat(req.body.studentFeedBack);
      let A = 0;
      const courseAttendance = parseFloat(req.body.courseAttendance);

      if (sFeedback >= 3.5) {
        A = 300;
      } else if (sFeedback > 3) {
        A = 210;
      } else if (sFeedback > 2) {
        A = 150;
      } else {
        A = 0;
      }

      const result = (A * courseAttendance) / 100;

      const userDocument = await studBucket.findOne({ name: req.user.username });

      if (userDocument) {
        // Update the document with the new values from sbucket2
        const updateResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $push: {
              sd4: {
                courseName: req.body.courseName,
                courseAttendance: req.body.courseAttendance,
                studentFeedBack: req.body.studentFeedBack,
                subTotal3: result,
              }
            },
          }
        );
        console.log("Update Result:", updateResult);
      }

      res.send("<script>alert('Your data is saved Successfully'); window.location.href = '/studBucket2'; clearSelectTags();</script>");
    } else {
      // Redirect to the home page if the user is not authenticated
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error in /save4 route:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

