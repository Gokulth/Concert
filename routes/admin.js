var express = require('express');
var router = express.Router();
const Concert = require('../model/concert');
var multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking=require('../model/booking_details')
const PDFDocument = require('pdfkit');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './public/images';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.get('/', function (req, res) {
    res.render('crudpage', { message: null,role:req.session.role,session:req.session });
});

router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { eventName, eventPlace, date, time, available_ticket, amount } = req.body;
        console.log(req.file)
        const imagePath = req.file ? `/images/${req.file.filename}` : null; 

        const existingConcert = await Concert.findOne({ eventName });

        if (existingConcert) {
            return res.render('crudpage', { message: "Concert with this name already exists" ,role:req.session.role,session:req.session });
        }

        const newConcert = new Concert({
            eventName,
            eventPlace,
            date,
            time,
            available_ticket,
            amount,
            image: imagePath  
        });

        await newConcert.save();

        console.log('Concert saved successfully:', newConcert);
        res.render('crudpage', { message: 'Concert saved successfully' ,role:req.session.role,session:req.session });

    } catch (error) {
        console.error('Error saving concert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/retrieve_events', (req, res) => {
    Concert.find()
        .then(data => res.render('retrieve', { data: data ,role:req.session.role}))
        .catch(error => console.log(error));
});
router.post('/delete_event/:id',(req, res) =>{
    const event = req.params.id;
    Concert.findByIdAndDelete(event)
        .then(() => {
          res.redirect('/admin/retrieve_events'); 
        })
        .catch(error => {
          console.error(error);
        });
    })
    router.get('/update/:id',(req,res)=>{
        Concert.findById(req.params.id)
        .then(data=>res.render('update',{concert:data,role:req.session.role}))
    })

    router.post('/update/:id', upload.single('image'), (req, res) => {
        console.log('Hellooo')
        const eventId = req.params.id;
        const { 
            eventName,
            eventPlace,
            date,
            time,
            available_ticket,
            amount
        } = req.body;
    
        
        const imagePath = req.file ? `/images/${req.file.filename}` : req.body.existingImagePath;
    
        Concert.findByIdAndUpdate(
            eventId,
            {
                eventName,
                eventPlace,
                date,
                time,
                available_ticket,
                amount,
                image: imagePath
            },
            { new: true } 
        )
        .then(() => {
            res.redirect('/admin/retrieve_events',);
        })
        .catch(error => {
            console.error('Error updating event:', error);
            res.status(500).send('Internal Server Error');
        });
    });


    router.get('/book-details', async (req, res) => {
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
        
    
        if (!result.docs.length) {
          return res.status(404).send("No bookings found.");
        }
    
        res.render('adminbookhistory', {
          bookings: result.docs,
          email,
          pagination: result,session:req.session 
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching booking details.');
      }
    });

    router.get('/alldetails', async (req, res) => {
      try {
        
        const totalBookings = await Booking.countDocuments();
        const bookings = await Booking.find()
                                      .populate('concertId').sort({ createdAt: -1 }); // Populates concert info
    
        if (!bookings.length) {
          return res.status(404).send("No bookings found.");
        }
    
        res.render('allbookings', { bookings , totalBookings,session:req.session });
      } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching booking details.');
      }
    });
    
module.exports = router;
