require('./db/config');
require('dotenv').config()
const User = require('./db/User');
const express = require('express');
const app = express();
const cors = require('cors');
const Product = require('./db/Product');
const multer = require('multer');
const UserProfile = require('./db/ImageDetails')
const JWT = require('jsonwebtoken');
const KEY = process.env.KEY;


app.use(express.json());
app.use(cors());
app.use(express.static("uploads"))



// SignUp Api
app.post('/signup', async (req, resp) => {
    if (req.body.name && req.body.email && req.body.password) {
        let user = new User(req.body);
        let result = await user.save();
        result = result.toObject();
        // delete result.email
        delete result.password
        JWT.sign({ result }, KEY, { expiresIn: '3h' }, (err, token) => {
            if (err) {
                resp.send({ Error: "something went wrong please try again latter" })
            } else {
                resp.send({ result, auth: token })
            }
        })
    } else {
        resp.send("Enter details")
    }
})

// Get api for double user
app.get('/getuser/:email',async(req,resp)=>{
    let result = await User.findOne({email:req.params.email})
    if(result){
        resp.send(result)
    }else{
        resp.send(false)
    }
})

// Login Api
app.post('/login', async (req, resp) => {
    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select('-password');
        // delete user.email
        // console.log(result)
        if (user) {
            JWT.sign({ user }, KEY, { expiresIn: "3h" }, (err, token) => {
                if (err) {
                    resp.send({ Error: "something went wrong please try again latter" })
                } else {
                    resp.send({ user, auth: token })
                }
            })
        } else {
            resp.send({ "Error": "User Not Found" });
        }
    } else {
        resp.send({ "Error": "User Not Found" });
    }
});


// AddProduct Api
app.post('/addproduct', verifyToken, async (req, resp) => {
    if (req.body.name && req.body.price && req.body.category && req.body.company) {
        let product = new Product(req.body);
        let result = await product.save();
        resp.send(result)
    } else {
        resp.send("Enter all the fields");
    }
})

// Product Component Api to show the products
app.get('/products',verifyToken, async (req, resp) => {
    let result = await Product.find();
    if (result) {
        resp.send(result)
    } else {
        resp.send("No Product found");
    }
})

// Delete Api
app.delete('/products/:id',verifyToken, async (req, resp) => {
    if (req.params.id) {
        let result = await Product.deleteOne({ _id: req.params.id })
        resp.send(result)
    } else {
        resp.send("Not Found")
    }
})


// Get product for update Api
app.get('/product/:id',verifyToken, async (req, resp) => {
    if (req.params.id) {
        let result = await Product.findOne({ _id: req.params.id })
        resp.send(result)
    } else {
        resp.send("Please select product")
    }
})


// Update Product Api
app.put('/updateproduct/:id',verifyToken, async (req, resp) => {
    if (req.params.id) {
        let result = await Product.updateOne({ _id: req.params.id }, { $set: req.body })
        resp.send(result)
    } else {
        resp.send("No result found")

    }
})


// Search Api
app.get('/search/:key', verifyToken, async (req, resp) => {
    if (req.params.key) {
        let result = await Product.find({
            '$or': [
                { name: { $regex: req.params.key } },
                { category: { $regex: req.params.key } },
                { company: { $regex: req.params.key } }

            ]
        });
        resp.send(result)
    } else {
        resp.send("No Result Found")

    }
})

// Upload image Multer 
const upload = multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null,'uploads/')
        },
        filename:function(req,file,cb){
            cb(null,Date.now()+file.originalname)
        }
    })
}).single("image");


// upload image Api 
app.post('/profile', upload, async(req,resp)=>{
    let result = new UserProfile({
        image:req.file.filename,
        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        mobile:req.body.mobile,
        address:req.body.address,
        hobby:req.body.hobby,
        userid:req.body.userid
    })
    result = await result.save();
    if(result){
        resp.send(result)
    }else{
        resp.send("error: something went wrong")
    }
})


// Put Update profile 
app.put('/updateProfile/:id',upload,async(req,resp)=>{
    let result = await UserProfile.updateOne(
        {userid:req.params.id},
        {$set:{
            image:req.file.filename,
        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        mobile:req.body.mobile,
        address:req.body.address,
        hobby:req.body.hobby,
        userid:req.body.userid
        }}
    )
    if(result){
        resp.send(result)
    }else{
        resp.send("error: something went wrong")
    }
})


// Get profile Api
app.get('/profile/:id',async(req,resp)=>{
    let result = await UserProfile.findOne({userid:req.params.id})
    if(result){
        resp.send(result)
    }else{
        resp.send(false);
    }    
})


// Middleware 
function verifyToken(req, resp, next) {
    let token = req.headers['authorization']
    if (token) {
        token = token.split(' ')[1];
        // console.log(token)
        JWT.verify(token,KEY,(error,valid)=>{
            if(error){
                resp.status(401).send({expire:"Token Expired"})
            }else{
                next();
            }
        })
    }else{
        resp.status(403).send("Please send the token")
    }
}




app.listen(process.env.PORT);
