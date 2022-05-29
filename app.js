// R E Q U I R E  S T U F F
const express = require('express');
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb')



//  D E C L A R A T I O N S

const app = express()
let userData = {}
let signInStatus = {
    signedin: false,
    userId: ''
}



// C O N N E C T I N G  M O N G O O S E

mongoose.connect('mongodb+srv://satyam:passwd22@cluster0.qlui6.mongodb.net/myBlog')



// M O N G O O S E  S C H E M A 

const myBlogSchema = new mongoose.Schema({
    heading: String,
    content: String
})

const usersSchema = new mongoose.Schema({
    userName: String,
    email: {
        type: String,
        unique: true
    },
    key: String,
    blogs: []
})



// M O N G O O S E  M O D E L

const BlogDb = mongoose.model('blog', myBlogSchema)
const Users = mongoose.model('user', usersSchema)



// U N I V E R S A L  F U N C T I O N S



const updateUserData = (callback) => {
    if (signInStatus.signedin) {
        Users.findOne({ _id: signInStatus.userId }, (err, docs) => {
            if (docs) {
                userData = docs
            }
            else if (err) {
                console.log(err)
            }
            else {
                console.log(`no data found`)
            }
            if (typeof callback == 'function') {
                callback()
            }
        })
    }
    else {
        if (typeof callback == 'function') {
            callback()
        }
    }
}

//  E X P R E S S  S T U F F

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))



// G E T  R E Q U E S T S

app.get('/home', (req, res) => {
    updateUserData(() => {
        res.render('home', { userData: userData, _: _, signInStatus: signInStatus })
    })
})

app.get('/', (req, resp) => {
    resp.redirect('/home')
})

app.get('/about', (req, resp) => {
    resp.render('about', { signInStatus: signInStatus, userData: userData })
})

app.get('/contact', (req, resp) => {
    { userData: userData }
    resp.render('contact', { signInStatus: signInStatus, userData: userData })
})

app.get('/blogs/:pathName', (req, resp) => {
    updateUserData(() => {


        for (let i = 0; i < (userData.blogs).length; i++) {
            if (req.params.pathName == userData.blogs[i]._id) {
                resp.render('blog', {
                    blog: userData.blogs[i], userData: userData, signInStatus: signInStatus
                })
            }
        }
    })
})

app.route('/compose')
    .get((req, resp) => {
        resp.render('compose', {
            signInStatus: signInStatus, userData: userData
        })
    })
    .post((req, resp) => {
        heading = req.body.heading
        content = req.body.content
        newBlog = { heading: heading, content: content }
        const blog = new BlogDb(newBlog)
        Users.updateOne({
            _id: signInStatus.userId
        },
            {
                $push: {
                    blogs: { $each: [newBlog] }
                }
            },
            (err) => {
                if (!err) { resp.redirect(`/home`) }
                else { resp.send('Kindly sign in first') }
            })
    })


app.route('/register')
    .get((req, resp) => {
        resp.render('register', {
            signInStatus: signInStatus, userData: userData
        })
    })
    .post((req, resp) => {
        let tempData = new Users({
            userName: req.body.userName,
            email: req.body.email,
            key: req.body.key
        })
        console.log(tempData)
        tempData.save((err, docs) => {
            if (!err) {
                console.log(`${docs.userName} registered as a new user`)
                resp.redirect('/signin')
            }
            else {
                console.log(`Something went wrong. Error : ${err}`)
                resp.send(`Something went wrong. Error : ${err}`)
            }
        })
    });

app.route('/signin')
    .get((req, resp) => {
        resp.render(`sign-in`, {
            signInStatus: signInStatus, userData: userData
        })
    })
    .post((req, resp) => {
        const signInData = {
            email: req.body.email,
            key: req.body.key
        }
        Users.findOne(signInData, (err, docs) => {
            if (docs) {
                console.log(`User successfully Signed in as ${docs.userName}`)
                signInStatus.signedin = true
                signInStatus.userId = `${docs._id}`
                resp.redirect('/home')
            }
            else {
                console.log(`Unable to sign in : ${err}`)
                resp.redirect('/home')
            }
        })
    })



// P O S T  R E Q U E S T S

app.post('/del', (req, resp) => {
    const id = req.body.blogId
    Users.updateOne({ 'blogs._id': ObjectId(id) }, {
        $pull: { blogs: { _id: ObjectId(id) } }
    }, (err) => {
        if (!err) {
            console.log('Blog delted successfully')
            resp.redirect('/home')
        }
        else {
            console.log(`Something went wrong. error : ${err}`)
        }
    })
})



// S T A R T I N G  T H E  S E R V E R 

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server stared...`)
})