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
    cb(null, uploadPath); // Specify the directory where files will be stored
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
    author: String, // Author of the comment (faculty, ro)
    content: String, // Comment content
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
    }
  }],
  comments2: [{
    author: String, // Author of the comment (faculty, ro)
    content: String, // Comment content
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
    }
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
    }
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
    }
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

app.get("/profile/studentBuckets", (req, res) => {
  res.render("facultySubmittedStudentB",  {name: req.user.name, email: req.user.username});
})

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

// app.post("/profile/studentBuckets/forms1/comment", checkRole('faculty'), async (req, res) => {
//   try {
//     const name = req.user.name;
//     const { commentText } = req.body;

//     // Find the faculty user and update the comments array
//     const updateResult = await studBucket.updateOne(
//       { name: name },
//       {
//         $push: {
//           comments1: {
//             author: req.user.role, // Assuming you want to store the commenter's name
//             text: commentText,
//           },
//         },
//       }
//     );
//     console.log('Update result:', updateResult);

//     res.redirect("/profile/studentBuckets/forms1");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });


app.post("/profile/studentBuckets/forms1/comment", checkRole('faculty'), async (req, res) => {
  try {
    const username = req.user.username;
    const { commentText } = req.body;

    // Find the faculty user and update the comments array
    const updateResult = await studBucket.updateOne(
      { name: username },
      {
        $push: {
          comments1: {
            author: username, // Assuming you want to store the commenter's name
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    console.log('Update result:', updateResult);

    // Check if a document was matched and modified
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

      // Fetch faculty members of the same department
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

app.post("/approve/submittedformsSD1/:name/comment", checkRole('ro'), async (req, res) => {
  try {
    const { name } = req.params;
    const {commentText} = req.body;
    const user = await studBucket.findOne({ name });
    // Find the faculty user and update the comments array
    const updateResult = await studBucket.updateOne(
      { name: name },
      {
        $push: {
          comments1: {
            author: req.user.name, // Assuming you want to store the commenter's name
            content: commentText,
            role: req.user.role,
            timestamp: Date.now(),
          },
        },
      }
    );

    console.log('Update result:', updateResult);

    // Check if a document was matched and modified
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

app.get("/evidence/:name/:filename", checkRole('ro'),(req, res) => {
  const { name, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Use res.sendFile to send the file to the client
  res.sendFile(filePath);
});


app.post("/approve/submittedForms/:name/save", checkRole('ro'),async (req, res) => {
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

    // Check if reviewerScore1 exists, if not, create it; otherwise, update it
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

    res.status(200).redirect(`/approve/submittedForms/${name}`);
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
      return res.redirect("/signup" );  // Redirect to signup page on error
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

let totalMarks = 0;

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

      // Ensure the userDocument has the necessary properties
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

      // Calculate the average of all subTotal1 values
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

  
        // Add return statement here
        return res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket1'; clearSelectTags();</script>");
      } else {
        // Removed the return statement here
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




app.post("/save2", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user.username);
    const courseResult = parseFloat(req.body.courseResult);

    if (isNaN(courseResult)) {
      return res.status(400).send("Invalid attendance value");
    }
    let result = 0;

    if(courseResult==100){
      result = 700;
    }else if(courseResult>=90){
      result = 590;
    } else if(courseResult>=80){
      result = 470;
    } else if(courseResult>=70){
      result = 350;
    } else if(courseResult>=60){
      result = 240;
    } else {
      result = 0;
    }

    try {
      const userDocument = await studBucket.findOne({ name: req.user.username });

      if (userDocument) {
        // Update the document with the new values from sbucket2
        const updateResult = await studBucket.updateOne(
          { name: req.user.username },
          {
            $push: {
              sd2: {
                courseName: req.body.courseName,
                courseResult: courseResult,
                subTotal2: result
              }
            }
          }
        )}
      res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket2'; clearSelectTags();</script>"); 
  } catch (error) {
      console.error(error);
  }

  } else {
    // Redirect to the home page if the user is not authenticated
    res.redirect("/");
  }
});


app.post("/save3", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user.username);

    const students100 = parseFloat(req.body.noOfStudents100per) * 20 ;
    
    const students90_99 = parseFloat(req.body.noOfStudents90To99per) * 15;

    const students80_89 = parseFloat(req.body.noOfStudents80To89per) * 10;

    const students70_79 = parseFloat(req.body.noOfStudents70To79per) * 7;

    const students60_69  = parseFloat(req.body.noOfStudents60To69per) * 5;

    const studentsBelow60 = parseFloat(req.body.noOfStudentsBelow60per) * 0;

    const total = students100 + students90_99 + students80_89 + students70_79 + students60_69 + studentsBelow60;

    try {
      const userDocument = await studBucket.findOne({ name: req.user.username });

      if (userDocument) {
        // Update the document with the new values from sbucket2
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
                subTotal3: total
              }
            }
          }
        )}
      res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket3'; clearSelectTags();</script>"); 
  } catch (error) {
      console.error(error);
  }

  } else {
    // Redirect to the home page if the user is not authenticated
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

