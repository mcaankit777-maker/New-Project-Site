    import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

import User from './Models/usermodel.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
  
 mongoose.connect(process.env.MONGO_URL)
    .then(()=>console.log('Ammy Database Connected'))
    .catch((error)=>console.log('Database Not Connected'));

    app.post('/users',async(req,res)=>{
        try {
            const newUser=new User({
                name:req.body.name,
                age:req.body.age,
                location:req.body.location,
                email:req.body.email
            });
            await newUser.save();
            res.status(200).json({message:'User Created'});
        } catch (error) {
            res.status(202).json({message:'User Not Created'});
        }
    })

    app.get('/users',async(req,res)=>{
        try {
            const user=await User.find();
            res.json(user);
        } catch (error) {
            res.status(301).json({message:'User Cannot Be Shown'});
        }
    })

    app.put('/users/:id',async(req,res)=>{
        try {
            const updateUser=await User.findByIdAndUpdate(req.params.id,{
                name:req.body.name,
                age:req.body.age,
                location:req.body.location,
                email:req.body.email,
                password:req.body.password
            },
        {new:true}
    );
        res.status(400).json({message:'User Updated',user:updateUser});
        } catch (error) {
            res.status(404).json({message:'User cannot be Updated'});
        }
    });


    app.delete('/users/:id',async(req,res)=>{
        try {
            const deleteUser=await User.findByIdAndDelete(req.params.id);
            res.status(202).json({message:'User Deleted'})
        } catch (error) {
            res.status(500).json({message:'User cannot be Deleted'});
        }
    })


    app.post('/register', async (req, res) => {
    try {
        const { name, age, location, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
        name,
        age,
        location,
        email,
        password: hashedPassword,
        });
        await newUser.save();

        res.status(201).json({ message: 'User Created Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'User Not Created' });
    }
    });


    app.post('/login',async(req,res)=>{
        try {
            const {email,password}=req.body;
            
            const user=await User.findOne({email});
            if(!user)
            {
                return res.status(404).json({message:'User Not Found'});
            }
            const isMatch = await bcrypt.compare(password, user.password);
            
            if(!isMatch)
                { return res.status(401).json({message:'Incorrect Password'});
        }
            const token=jwt.sign({id:user._id , role: user.role}, "secretkey", {expiresIn:"1h"});
            res.status(200).json({message:'Login Successfull',token});
        } catch (error) {
            res.status(202).json({message:'Not Login Successfully'});
        }
    })


    function auth(req,res,next){
        const token=req.header("Authorization")?.replace("Bearer","");
        if(!token) return   res.status(401).json({message:'No Token , Access Denied'});
        try {
            const verified=jwt.verify(token,"secretkey");
            req.user=verified;
            next();
        } catch (error) {
            res.status(400).json({message:'Invalid Token'});
        }
    }

   app.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            location: user.location,
            age: user.age
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});




  

 app.listen(9898,()=>{
        console.log('Server running at http://127.0.0.1:9898');
    });