var mongoose=require('mongoose');
const mongoosepaginate=require('mongoose-paginate-v2')
const concert=new mongoose.Schema({
    eventName:{
        type:String,
        required:[true,'event name is required'],
        maxlength:[10,'not exceed 10 characters']
    },
    eventPlace:{
        type:String,
        required:[true,"place is required"]
    },
    date:{
        type:Date,
        required:[true,'date is required']
    },
    time:{
        type:String
    },
    available_ticket:{
        type:Number
    },
    amount:{
        type:Number,
        required:[true,'amount is required']
    
    },
    image:{
        type: String
    }

    
})
concert.plugin(mongoosepaginate);
const Concert= new mongoose.model('concert',concert)
module.exports=Concert;
