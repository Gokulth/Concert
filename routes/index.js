var express = require('express');
const error = require("formidable");
const {validationResult,check}=require('express-validator');
const User = require('../model/user');
const bcrypt=require('bcrypt');
const Concert=require('../model/concert')






var router = express.Router();

/* GET home page. */
router.get('/signup', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  res.render('signup',{errors:[],title:'signup',message:null,session:req.session})
});
router.post('/signup',[
  check('username').isAlpha() .withMessage('username must be atleast 6 characters'),
  check('email').isEmail().withMessage('invalid email'),
  check('password').isLength({min:6}).withMessage('password atleast 6 characters required'),
 
],function(req,res){
  const errors=validationResult(req);
    if(!errors.isEmpty()){  
      res.render('signup',{errors:errors.array(),message:null,title:"signup"})
    }const {password,confirmpassword}=req.body
    if(password!==confirmpassword){
    
      res.render('signup',{errors:null,title:'signup',message:'password must be same!'})
    }else{const {email,username,password}=req.body
      User.findOne({email})
      .then(existingUser=>{
        if(existingUser){
          return res.render('signup',{message:"email already taken",errors:null,title:"signup",session:req.session})
        }else{
          return bcrypt.hash(password,10)
        }
      }).then(hashedpassword=>{
    
    const userdata=new User({username,password:hashedpassword,email,role:'User'})
    return userdata.save()})
    .then(()=>{
      res.redirect('/login')
    })
}
});
router.get('/login',function(req,res){
    res.render('login',{title:'login',errors:null,message:null,session:req.session})

});
router.post('/login',
   function(req,res){
      const{email,password}=req.body
      
       User.findOne({email})
      .then(user=>{
        if(!user){
         return res.render('login',{message:"invalid email and password",errors:null,title:'login',session:req.session})
        }
        const founduser=user
       bcrypt.compare(password, user.password).then(
        (pass) =>{
          if(!pass){
            return res.render('login',{message:"invaild password",errors:null,title:"login",})
          }     
           else{
              req.session.username=founduser.username
              req.session.email=founduser.email
              req.session.role=founduser.role
              res.redirect('/')
          }
        }
       )
      
     
      })
     
})


router.get('/', (req, res) => {
  Concert.find().limit(4)
      .then(data => {
          res.render('index', { data: data ,role:req.session.role,session:req.session}); 
      })
      .catch(error => {
          console.error("Error fetching concerts: ", error);
          res.status(500).send("Error fetching concerts");
      });
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Error destroying session:', err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid'); // Optional: clears the session cookie
    res.redirect('/login'); 
  });
});



module.exports = router;
