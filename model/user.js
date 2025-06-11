var mongoose=require('mongoose');
const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[true,'email is required'],
        
    },
    password:{
        type:String,
        required:[true,'password is required'],
        minlength:[6,'atleast 6 chararcters required '],
        
    },
    username:{
        type:String,
        required:[true,'username is required']
    },
    role:{
        type:String
    }
    
})
const User=new mongoose.model('user',UserSchema)
module.exports=User