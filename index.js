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
  userType: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
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
    }
  }],
  totalMarks: {
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

// app.get("/studBucket1", (req, res) => {
//   res.render("studBucket1", {name: req.user.name, email: req.user.username});
// });

app.get("/index", (req, res) => {
  res.render("index",  {name: req.user.name, email: req.user.username});
})

app.get("/studBucket1", async (req, res) => {
  try {
    const userDocument = await studBucket.findOne({ name: req.user.username });
    if (userDocument) {
      const subtotal1 = userDocument.sd1[0].subTotal1; // Adjust this according to your data structure
      const percentage = (subtotal1 * 100)/2000; 
      res.render("studBucket1", { name: req.user.name, email: req.user.username, percentage: percentage });
    } else {
      res.render("studBucket1", { name: req.user.name, email: req.user.username, percentage: 0});
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

app.post("/signup", (req, res) => {
  const newUser = new User({
    username: req.body.username,
    name: req.body.name,
    employeeCode: req.body.employeeCode,
    department: req.body.department,
    designation: req.body.designation,
    periodOfEvaluation: req.body.periodOfEvaluation,
    userType: req.body.userType,
    password: req.body.password
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
      passport.authenticate("local")(req, res, function(){
        res.render("index", {name: req.user.name, email: req.user.username});
      });
    }
  });

});

let totalMarks = 0;

app.post("/save1", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user.username);
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

    totalMarks = totalMarks + attendance;

    const sbucket1 = {
      name: req.user.username,
      sd1: [{
        courseName: req.body.courseName,
        courseAttendance: courseAttendance,
        subTotal1: attendance
      }],
      totalMarks: totalMarks
    };

    try {
      const bucketdata = await studBucket.insertMany(sbucket1);
      console.log(bucketdata);
      res.send("<script>alert('You data is saved Successfully'); window.location.href = '/studBucket1'; clearSelectTags();</script>"); 
  } catch (error) {
      console.error(error);
  }

  } else {
    // Redirect to the home page if the user is not authenticated
    res.redirect("/");
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

    totalMarks = totalMarks + result;

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
              },
              totalMarks: totalMarks
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

    totalMarks = totalMarks + total;

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
              },
              totalMarks: totalMarks
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

      totalMarks = totalMarks + result;

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
              },
              totalMarks: totalMarks
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

