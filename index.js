const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT||5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



//VerifyJWT
const VerifyJWT = (req,res,next)=>{
    email=req.query.email;
    const authHeader = req.headers.authorization;
    if(!authHeader || !email){
        return res.status(401).send({message:'unauthorized access'});
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.status(403).send({message:"Forbidden Access"});
        }
        req.decoded = decoded;
         next();
    })
}

// Index
app.get('/',(req,res)=>{
    res.send("server is running");
})

//MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vu0py.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async()=>{
    try{
        await client.connect();
        const todos =client.db("todos").collection("todos")
        //AUTH API
        app.post('/login',async(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.JWT_SECRET,{
                expiresIn:'1d'
            });
            res.send({token})
        });
        
        //ADD TASK
        app.post('/addtask',async(req,res)=>{
                const result = await todos.insertOne(req.body)
                res.send(result)
        });

        //GET ONLY TODOS WITH GIVEN EMAIL (JWT)
        app.get('/todos',VerifyJWT,async(req,res)=>{
            const decodedEmail=req?.decoded?.email;
            const QueryEmail = req?.query?.email;
            if(decodedEmail === QueryEmail){
            if(QueryEmail){
                const query={email:QueryEmail};
                const cursor = todos.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }
            else{
                res.send([]);
            }
            }
            else{
                res.status(403).send({message:"Forbidden Access!"});
            }
        });
        //DELETE TASK
        app.delete('/deleteTask/:id',async(req,res)=>{
            try{
                const id=req.params.id;
            if(id){
                const query = {_id:ObjectId(id)};
                const result = await todos.deleteOne(query);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"});
            }
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });

        //COMPLETE
        app.put('/completeTask/:id',async(req,res)=>{
            try{
                const id=req.params.id;
            if(id){
                const filter = {_id:ObjectId(id)};
                const options = { upsert: true };
                const updateTask = {
                    $set: {
                        complete: true,
                    },
                };
                const result = await todos.updateOne(filter, updateTask, options);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"});
            }
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });
    }
    finally{

    }
}
run().catch(console.dir);




//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
