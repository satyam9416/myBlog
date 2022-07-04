// R E Q U I R E  S T U F F

const express = require('express');
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const passportLocalMongoose = require('passport-local-mongoose');
const res = require('express/lib/response');
const req = require('express/lib/request');



//  D E C L A R A T I O N S

const app = express()


// M O N G O O S E  S T U F F




//  E X P R E S S  S T U F F

app.set('view engine', 'ejs')                                // Setting up view engine a ejs
app.use(bodyParser.urlencoded({ extended: true }))           // Setting Body-Parser
app.use(express.static('public'))                            // Excessing static files
// Passport initialization
app.use(session({
    secret: 'This is my secret',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())



// M O N G O O S E  S C H E M A 

const blogsSchema = new mongoose.Schema({
    heading: String,
    content: String
})

const usersSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        unique: true
    },
    key: String,
    blogs: [{
        heading : String,
        content : String
    }]
})
usersSchema.plugin(passportLocalMongoose)          // passport plugin

// M O N G O O S E  M O D E L

const Users = mongoose.model('user', usersSchema)
// P A S S P O R T  S T U F F
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'key'
}, (username, password, done) => {
    Users.findOne({ email: username }, (err, user) => {
        if (!user) {
            return done(null, false, { message: 'User not found' })
        }
        if (user.key !== password) {
            return done(null, false, { message: 'Wrong password' })
        }
        return done(null, user)

    })
}))
passport.serializeUser(Users.serializeUser())
passport.deserializeUser(Users.deserializeUser())
// G E T  R E Q U E S T S
app.get('/home', (req, resp) => {
    if (req.user) {
        Users.findById((req.user._id), (err, user) => {
            if (!err) {
                // console.log(user)
                resp.render('home', { userData: user, _: _ })
            }
        })
    }
    else {
        resp.render('home', { userData: req.user })
    }
})

app.get('/', (req, resp) => {
    resp.redirect('/home')
})

app.get('/about', (req, resp) => {
    resp.render('about', { userData: req.user })
})

app.get('/blogs/:pathName', (req, resp) => {
    if (req.user) {
        Users.findById(req.user._id, (err, docs) => {
            if(!err){
                let blog;
                for(let i = 0; i < docs.blogs.length; i++){
                    if(docs.blogs[i]._id == req.params.pathName){
                        resp.render('blog', {userData: docs, blog : docs.blogs[i]})
                    }
                }
            }
            else{
                resp.send(`Something went wrong. Error : ${err}`)
            }
        })
    }
    else{
        resp.redirect('/signin')
    }
})

app.route('/compose')
    .get((req, resp) => {
        if (req.user) {
            resp.render('compose', { userData: req.user })
        } else {
            resp.redirect('/register')
        }
    })
    .post((req, resp) => {
        let newBlog = {
            heading: req.body.heading,
            content: req.body.content
        }
        Users.findOneAndUpdate({ _id: req.user._id }, { $push: { 'blogs': newBlog } }, (err, user) => {
            if (!err) {
                console.log(user)
                console.log(`new blog updated by ${req.user.username}`)
                resp.redirect('./home')
            } else {
                console.log(`error : ${err}`)
            }
        })
    })



app.route('/register')
    .get((req, resp) => {
        resp.render('register', { userData: req.user })
    })
    .post((req, resp) => {
        const newUser = new Users({
            username: req.body.username,
            email: req.body.email,
            key: req.body.key
        })
        newUser.save().then(
            resp.redirect(`/signin`)
        )

    });

app.route('/signin')
    .get((req, resp) => {
        resp.render(`sign-in`, { userData: req.user })
    });

app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin' }), (req, resp) => {
    resp.redirect('/')
})



// P O S T  R E Q U E S T S

app.post('/del', (req, resp) => {
    if(req.user){const id = req.body.blogId
    Users.updateOne({ _id : req.user._id, 'blogs._id': ObjectId(id) }, {
        $pull: { blogs: { _id: ObjectId(id) } }
    }, (err) => {
        if (!err) {
            console.log('Blog delted successfully')
            resp.redirect('/home')
        }
        else {
            console.log(`Something went wrong. error : ${err}`)
        }
    })}
    else{
        resp.redirect('/signin')
    }
})


// E S T A B L I S H I N G  C O N N E C T I O N 

mongoose.connect('process.env.MONGO_SERVER', () => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server stared..., Running on port ${3000}`)
    })
})