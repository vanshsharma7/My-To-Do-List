require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model")
const Note = require("./models/note.model")

const express = require("express")
const cors = require("cors")
const app = express()

const jwt = require("jsonwebtoken")
const { authenticateToken } = require("./utils")

app.use(express.json());
const port = 7000;

app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (req, res) => {
    res.json({ data: "Hello" });
});

//Get All To Do API
app.get("/get-all-to-do", authenticateToken, async (req, res) => {
    const { user } = req.user;
    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
        return res.json({ error: false, notes, message: "Notes Retrieved Successfully" });
    }
    catch {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

//Get User API
app.get("/get-user",authenticateToken,async(req,res)=>{
    const {user} = req.user;
    const isUser = await User.findOne({_id: user._id});
    if(!isUser){
        return res.sendStatus(401);
    }
    return res.json({user: {fullname: isUser.fullname, email: isUser.email, "_id": isUser._id, createdOn: isUser.createdOn}, message: ""});
}); 

//Create Account API
app.post("/create-account", async (req, res) => {
    const { fullname, email, password } = req.body;
    if (!fullname) {
        return res.status(400).json({ error: true, message: "Full Name is required" });
    }
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.json({ error: true, message: "User already exist" });
    }

    const user = new User({
        fullname,
        email,
        password
    });

    await user.save();

    const accesstoken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET);

    return res.json({
        error: false,
        user,
        accesstoken,
        message: "Registration Successful"
    });

})

//Login API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: "User not found" });
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "Login Successful",
            email,
            accesstoken,
        });
    }
    else {
        return res.status(400).json({ error: true, message: "Invalid Email or Password" });
    }
});

//Add To Do API
app.post("/add-a-to-do", authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { user } = req.user;

    if (!title) {
        return res.status(400).json({ error: true, message: "Title is required" });
    }
    if (!content) {
        return res.status(400).json({ error: true, message: "Content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id
        })
        await note.save();
        return res.json({ error: false, note, message: "Note Added Successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

//Edit To Do API
app.put("/edit-a-to-do/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res.status(400).json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" })
        }
        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({ error: false, note, message: "Note Updated Successfully" });
    }
    catch {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

//Pin To Do API
app.put("/pin-a-to-do/:noteId",authenticateToken,async(req,res)=>{
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" })
        }

        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({ error: false, note, message: "Note Pinned Successfully" });
    }
    catch(error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

//Delete To Do API
app.delete("/delete-a-to-do/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;
    try {
        const note = await Note.findOne({_id: noteId, userId: user._id})
        if(!note){
            return res.status(404).json({error: true, message: "Note not found"});
        }

        await Note.deleteOne({_id: noteId, userId: user._id});

        return res.json({error: false, message: "Note deleted successfully"});
    }
    catch(error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})


app.listen(port, () => {
    console.log(`Server Started at Port ${port} ...`)
})

module.exports = app;