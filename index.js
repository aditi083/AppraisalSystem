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
      reviewerScore: {
        type: Number
      }
  }],
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
    reviewerScore: {
      type: Number
    }
  }],
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
    reviewerScore: {
      type: Number
    }
  }],
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
    reviewerScore: {
      type: Number
    }
  }],
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
    reviewerScore: {
      type: Number
    }
  }],
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
})

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

      res.render("approve", { facultyMembers, name: req.user.name, email: req.user.username });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/approve/submittedForms/:name", async (req, res) => {
  try {
    // Retrieve the username from the request parameters
    const { name } = req.params;

    // Fetch the user or faculty based on the username from the database
    const user = await studBucket.findOne({ name });

    if (user) {
      // Render a template or send data related to the user's submitted forms
      res.render('submittedForms', { user });
    } else {
      // If the user is not found, handle accordingly (e.g., show an error message)
      res.status(404).send('No details found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// POST method for handling Ro scores
app.post("/approve/submittedForms/:name/save", async (req, res) => {
  try {
    const { name } = req.params;
    const i = req.body.index; // Access the dynamically generated i value

    const reviewerScoreValue = parseFloat(req.body[`sd1_reviewerScore_${i}`]);

    if (isNaN(reviewerScoreValue)) {
      return res.status(400).send('Invalid reviewer score value');
    }

    // Update the document with the new reviewerScore value
    const updateResult = await studBucket.updateOne(
      { name },
      {
        $set: {
          [`sd1.${i}.reviewerScore`]: reviewerScoreValue
        }
      }
    );

    return res.status(200).redirect(`/approve/submittedForms/${name}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});





app.get("/ro-home", checkRole('ro'), (req, res) => {
  res.render("ro-home", { name: req.user.name, email: req.user.username });
});

app.get("/approve", async (req, res) => {
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

app.post("/save1", async (req, res) => {
  try {
    if (req.isAuthenticated() && req.user && req.user.username) {
      const courseAttendance = parseFloat(req.body.courseAttendance);

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

      // Update the document with the new values from sbucket1
      const updateResult = await studBucket.updateOne(
        { name: req.user.username },
        {
          $push: {
            sd1: {
              courseName: req.body.courseName,
              courseAttendance: courseAttendance,
              subTotal1: attendance
            }
          }
        }
      );

      res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket1'; clearSelectTags();</script>");
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

