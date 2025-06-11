var express = require('express');
var router = express.Router();
const Concert=require('../model/concert')
const user=require('../model/user')
const Booking=require('../model/booking_details')
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const ejs = require('ejs');




function authentication(req,res,next){
    if(req.session && req.session.email){
     return next()
    }
      res.redirect('/login')
    
}
async function email(booking,res){

  await booking.populate('concertId'); 

    console.log('Populated Booking Object:', booking);
    

 try{
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "2984d7ed02bb65",
      pass: "37486935d555f1"
    }
  });
  const qrData = `
User: ${booking.username}
Email: ${booking.email}
Event: ${booking.concertId?.eventName}
Place: ${booking.concertId?.eventPlace}
Date: ${new Date(booking.concertId?.date).toLocaleDateString('en-GB')}
Tickets: ${booking.ticketQuantity}
Total: $${booking.total_amount}
`;
const qrImage = await QRCode.toDataURL(qrData);

  
  const template= await fs.readFile('./views/email-template.ejs','utf8');
  const htmlContent = ejs.render(template, { bookings: [booking],qrCode: qrImage },{session:req.session});

  const mailOptions={
    from:'gokulth6@gmail.com',
    to: 'your_mailtrap_inbox@mailtrap.io',
    subject:'Event Booking Confirmation',
    html: htmlContent,
  };
  const info=await transport.sendMail(mailOptions);
  console.log('mail snd',info.response);
  transport.close();
  
  
  
} catch(error) {
console.error('error sending email',error);

}
}


router.get('/user',function(req,res){
  res.render('crudpage',{role:req.session.role})
});
router.get('/booknow/:id',authentication,function(req,res){

  Concert.findById(req.params.id)
  
  
  .then(data => {
    console.log(req.session.username)
    console.log(req.session.role)
      res.render('booknow', { concert: data,role:req.session.role, user:data,username:req.session.username,email:req.session.email,session:req.session}); 
  })
  .catch(error => {
      console.error("Error fetching concerts: ", error);
      res.status(500).send("Error fetching concerts");
  });
  
})

router.post('/bookings/:id', async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    

    const newBooking = new Booking({
      username: req.body.username,
      email: req.body.email,
      ticketQuantity: Number(req.body.ticketQuantity),
      total_amount: Number(req.body.totalAmount),
      concertId: concert._id,
    });

    concert.available_ticket -= Number(req.body.ticketQuantity);
    await concert.save();

    await newBooking.save();

    const populatedBooking = await Booking.findById(newBooking._id).populate('concertId');

    await email(populatedBooking,res);
    console.log('Redirecting to:', `/booking-details/${concert._id}`);
    

    res.redirect(`/users/booking-details?email=${req.body.email}`);
  
    console.log('saved')
  } catch (error) {
    console.error('Error saving booking:', error.message);
    res.status(500).send('Error saving booking.');
  }
});
router.get('/booking-details', async (req, res) => {
  try {
    const email = req.session.email;
    const { page = 1, limit = 3 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: 'concertId',
      sort: { createdAt: -1 }
    };

    const result = await Booking.paginate({ email }, options);
    const totalBookings = await Booking.countDocuments({ email });

    if (!result.docs.length) {
      return res.status(404).send("No bookings found.");
    }

    res.render('booking-details', {
      bookings: result.docs,
      email: req.session.email,
      totalBookings,
      pagination: result,session:req.session
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching booking details.');
  }
});

router.get('/bookinghistory', (req, res) => {
  Booking.find()
  res.redirect('booking-details')
      
})






router.get('/bookings/pdf/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('concertId');
    if (!booking) return res.status(404).send('Booking not found');

    const doc = new PDFDocument();
    const filename = `${booking.concertId?.eventName || 'N/A'}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Event Booking Details', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Username: ${booking.username}`);
    doc.text(`Email: ${booking.email}`);
    doc.text(`Event Name: ${booking.concertId?.eventName}`);
    doc.text(`Place: ${booking.concertId?.eventPlace}`);
    doc.text(`Date: ${new Date(booking.concertId?.date).toLocaleDateString('en-GB')}`);
    doc.text(`Tickets: ${booking.ticketQuantity}`);
    doc.text(`Total Amount: $${booking.total_amount}`);

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Error generating PDF');
  }
});







module.exports = router;
