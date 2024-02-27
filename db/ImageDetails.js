const mongoose =  require('mongoose');

const imageSchema = mongoose.Schema({
    image:String,
    fname:String,
    lname:String,
    email:String,
    mobile:Number,
    address:String,
    hobby:String,
    userid:String
})

module.exports = mongoose.model('images',imageSchema);