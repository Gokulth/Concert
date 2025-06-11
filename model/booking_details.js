const mongoose = require('mongoose');
const mongoosepaginate=require('mongoose-paginate-v2')
const bookingSchema = new mongoose.Schema({
    concertId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'concert'  
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    ticketQuantity: {
        type: Number,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
 }, {
        timestamps: true 
    
});
bookingSchema.plugin(mongoosepaginate);
const Booking = mongoose.model('Booking', bookingSchema); // Model name should be 'Booking'

module.exports = Booking;
