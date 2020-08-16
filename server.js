'use strict';

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongodb = require('mongodb');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const addExerciseSchema = new mongoose.Schema({
  description:{ type: String, required: true },
  duration:{ type: Number, required: true },
  date:String
});
const userSchema = new mongoose.Schema({
 username:{ type: String, required: true },
  log:[addExerciseSchema]
});
// schema into model
const Add = mongoose.model('Add', addExerciseSchema);
const User = mongoose.model('User', userSchema);






app.post("/api/exercise/new-user",function(req,res){
   var clientusername = req.body.username;
  var re = /^\d+$/;
  if(!re.test(clientusername) && clientusername!= ""){
   var data = new User({
username:clientusername,
    
   });
 data.save(function(err, data) {
    if (err) console.error(err);
  var resObj = {};
   resObj['_id']=data.id;
   resObj['username']=data.username;
   
return res.json(resObj);
    })
       } 
    else{
return res.json({"error":"invalid username"})
}
  
 
})

app.get("/api/exercise/users",(req,res)=>{
  User.find({}, (err,found)=>{
     if(err)console.error(err);
 else res.send(found)
  })

 
})
app.post("/api/exercise/add",(req,res)=>{
  var userid = req.body.userId;
  var description = req.body.description;
  var duration = parseInt(req.body.duration);
  function date(){
    if(req.body.date==""){
      var d = new Date()
      return d.getFullYear() + "-" + (d.getMonth()+1)+ "-"+ d.getDate()
    }else{return req.body.date}
    }
  var adding = new Add({
description:description,
    duration:duration,
    date:date()
  })
  
  User.findByIdAndUpdate(userid, {$push:{log: adding}},{new:true},(err,found)=>{
     if(err)res.send({error:'invalid Id'})
  else{ var resObj = {};
   resObj['_id']=found.id;
   resObj['username']=found.username;
   resObj['description']=adding.description;
   resObj['duration']=adding.duration;
    resObj['date']=new Date(adding.date).toDateString();   
 res.json(resObj)
      }
  })

 
})

app.get("/api/exercise/log",(req,res)=>{
  var log = req.query.userId
  User.findById(log, (err,found)=>{
     if(err)console.error(err);
   var resObj = found
    if(req.query.from || req.query.to){
      let fromDate = new Date(0)
      let toDate = new Date()
      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }
      fromDate = fromDate.getTime();
      toDate = toDate.getTime();
      resObj.log = resObj.log.filter((obj)=>{
        let objDate =new Date(obj.date).getTime()
        return objDate >= fromDate && objDate <= toDate
      })
    }
        if(req.query.limit){
resObj.log = resObj.log.slice(0,req.query.limit)
    }
   resObj['count']=found.log.length
   res.json(resObj)
   
  })

})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
