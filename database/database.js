const mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/project');
const db=mongoose.connection;
db.on('error',console.error.bind(console,'MongoDB connection Error'));
db.once('open',()=>{
    console.log("connected to MongoDB")
});
module.exports=db;