const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const User = require('../models/user');


const checkAdminRole = async (userID) => {
    try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
    }catch(err){
        return false;
    }
}

// POST route to add a candidate
router.post('/',jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id))){
            return res.status(403).json({message: 'user does not have admin role'});
        }
        const data = req.body // Assuming the request body contains the candidate data

        // Create a new Person document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');

        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID',jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Person.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('Candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID',jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Person.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('Candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// Let's start voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    // no admin can vote
    // user can only vote once

    candidateID = req.params.candidateID;
    UserID = req.user.id;

    try{
        //find the cadidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({message: 'candidate not found'});
        }
        const user = await User.findById(UserID);
        if(!user){
            return res.status(404).json({message: 'user not found'});
        }
        if(user.isVoted){
            res.status(400).json({message : 'You have already voted'});
        }
        if(user.role == 'admin'){
            res.status(403).json({message: 'admin is not allowed'});
        }

        //update the candidate document to record the vote
        candidate.votes.push({user: UserID});
        candidate.voteCount++;
        await candidate.save();

        //update the user document
        user.isVoted = true;
        await user.save();

        res.status(200).json({message : 'Vote recorded Sucessfully'});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//vote count
router.get('/vote/count', async (req, res)=>{
    try{
        // find all candidates
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        //Map the candidate to only return their name and voteCount
        const voteRecord = candidate.map((data) =>{
            return{
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;