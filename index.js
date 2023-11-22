import express from "express";
import cors from 'cors'
import{ MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import cookieParser from'cookie-parser';
import 'dotenv/config'

const app = express();
const port = process.env.PORT || 5000;

app.use(cors(
                {
                origin:[
                  'https://fixpro-client.web.app',
                  'fixpro-client.firebaseapp.com ',
                  'http://localhost:5173',
                  'http://localhost:5174',
                 'https://fixpro-sahariar.netlify.app'
                ],
                credentials:true,
                }
          ));

app.use(express.json());
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.send('connected');
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kzarlhv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


//middleware
const verifyToken = (req,res,next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware',token)
  if(!token){
    return res.status(401).send({ message : 'Unauthorized access' })
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      console.log(err)
      return res.status(401).send({ message : 'unauthorized' })
    }
    console.log('token value',decoded)
    req.user = decoded;
    next()
  })
  
}



async function run() {

  try {
    const serviceCollection = client.db('fixproDB').collection('services');
    const bookingCollection = client.db('fixproDB').collection('bookings');


    //auth related route

    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn:'1h' });
      console.log('token create',token);
      res
      .cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true});


      
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.post('/services',async(req,res)=>{
      const query = req.body;

      const result = await serviceCollection.insertOne(query);
      res.send(result);
    })
    app.get('/services', async(req,res)=>{

        console.log('token',req.cookies.token);
        console.log('from valided token',req.user)
        const query = serviceCollection.find();
        const result = await query.toArray();
        res.send(result);
    })

    app.get('/services/:id',async(req,res)=>{
        const id = req.params.id;
        const query = { _id : new ObjectId(id) };
        const result = await serviceCollection.findOne(query);
        res.send(result);
         
    })

    app.delete('/services/:id',async(req,res)=>{
          const id = req.params.id;
          const query = { _id : new ObjectId(id) };
          const result = await serviceCollection.deleteOne(query);
          res.send(result);
    })

    app.put('/services/:id',async(req,res)=>{

      const id = req.params.id;
      const query = { _id : new ObjectId(id) };
      const update = req.body;
      const options = { upsert : true };
      const service = {
         $set : {
          service_name : update.service_name,
          service_img : update.service_img,
          provider_email : update.provider_email,
          service_provider_name : update.service_provider_name,
          service_location : update.service_location,
          service_price : update.service_price,
          provider_img : update.provider_img,
          provider_desc : update.provider_desc,
          service_description :update.service_description
         }
      }
      const result = await serviceCollection.updateOne(query,service,options);
      res.send(result);

    })

    app.post('/bookings',async(req,res)=>{
        const cursor = req.body;
        const result = await bookingCollection.insertOne(cursor);
        res.send(result);
    })

    app.get('/bookings',verifyToken,async(req,res)=>{
        // console.log('query',req.query.email);
        // console.log("token email",req.user.email);
        if(req.query.email !== req.user.email){
          return res.status(403).send({ massage :'Forbidden' })
        }

        //jodi individual email r data pete chai tobe ai code

        // console.log('tok tok token',req.cookies.token)
        // let query ={};
        // if(req.query?.email){
        //     query = { uemail: req.query.email }
          
        // }

        // end 


        const query = bookingCollection.find();
        const result = await query.toArray();
        res.send(result);
        
        //final

        //Normal query

        // const query = bookingCollection.find();
        // const result = await query.toArray();
        // res.send(result);
    })

    app.delete('/bookings/:id',async(req,res)=>{
        const id = req.params.id;
        const query = { _id : new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
    })

    app.get('/bookings/:id',async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      res.send(result);
       
  })

    app.put('/bookings/:id',async(req,res)=>{

      const id = req.params.id;
      const query = { _id : new ObjectId(id) };
      const update = req.body;
      const options = { upsert : true };
      const booking = {
         $set : {
          sname : update.sname,
          simage : update.simage,
          pname : update.pname,
          date : update.date,
          price : update.price,
          instruction : update.instruction,
         }
      }
      const result = await bookingCollection.updateOne(query,booking,options);
      res.send(result);

    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log("form port :",{port})
})