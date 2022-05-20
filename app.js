const express = require('express');
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose')
const app = express()
let blogs = [];
mongoose.connect('mongodb+srv://satyam:passwd22@cluster0.qlui6.mongodb.net/myBlog')
const myBlogSchema = new mongoose.Schema({
    heading: String,
    content: String
})
const BlogDb = mongoose.model('blog', myBlogSchema)

function updateBlogs(callback) {
    BlogDb.find({}, (err, blog) => {
        if (err) {
            console.log(err)
        } else {
            blogs = blog
        }
        if (typeof callback == "function")
            callback();
    })
}
updateBlogs()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/home', (req, resp) => {
    updateBlogs(() => {
        resp.render('home', { blogs: blogs, _: _ })
    })
})
app.get('/', (req, resp) => {
    resp.redirect('/home')
})
app.get('/about', (req, resp) => {
    resp.render('about')
})
app.get('/contact', (req, resp) => {
    resp.render('contact')
})
app.get('/compose', (req, resp) => {
    resp.render('compose')
})
app.get('/:pathName', (req, resp) => {
    let exist
    updateBlogs((res, rej) => {
        let pathName = _.lowerCase(req.params.pathName)
        blogs.forEach((blog) => {
            blogTitle = _.lowerCase(blog.heading)
            if (blogTitle === pathName) {
                res(blog)
            }
        })
        rej(`<h1>Blog post doesn't exit !</h1>`)
    }).then((blog) => {
        resp.render('blog', { blog: blog })
    }).catch((warn) => {
        resp.send(warn)
    })
})

app.post('/newBlog', (req, resp) => {
    heading = req.body.heading
    content = req.body.content
    newBlog = { heading: heading, content: content }
    const blog = new BlogDb(newBlog)
    blog.save((err) => {
        if (err) {
            console.log(err)
            resp.send('Something wen wrong, please try again later')
        }
        else {
            console.log('A new blog saved !!')
        }
    })
    updateBlogs(() => {
        resp.redirect(`/${_.kebabCase(heading)}`)
    })
})
app.post('/del', (req, resp) => {
    BlogDb.deleteOne({ _id: req.body.blogId }, (err) => {
        if (err) {
            console.log(err)
            resp.send('Something wen wrong, please try again later')
        }
        else {
            console.log('Delete one blog Successully')
            updateBlogs(() => {
                resp.redirect('/home')
            })
        }
    })
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server stared...`)
})