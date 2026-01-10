import foodModel from "../models/foodModel.js";
import fs from "fs";

/// add food item

const addFood=async(req,res)=>{

    let image_filename=`${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        image: image_filename,
        category: req.body.category,
    })
    try{
        await food.save();
        res.json({success:true,message:"Food item added successfully"});
    }catch(err){
        console.log(err);
        res.json({success:false,message:"Error while adding food item"});
        }
}


// all food list
const listFood=async(req,res)=>{
    try{
        const foods=await foodModel.find({});
        res.json({success:true,data:foods});
    }
    catch(err){
        console.log(err);
        res.json({success:false,message:"Error while fetching food items"});
    }
}

/// remove food item
const removeFood=async(req,res)=>{
    try{
        const food=await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`,()=>{});

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,message:"Food item removed successfully"});

    }catch(err){
        console.log(err);
        res.json({success:false,message:"Error while removing food item"});
    }
}


// edit/update food item

const editFood = async (req, res) => {
  try {
    const { id, name, category, price, description } = req.body;
    const food = await foodModel.findById(id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });

    // Update fields
    food.name = name || food.name;
    food.category = category || food.category;
    food.price = price || food.price;
    food.description = description || food.description;

    // Update image if uploaded
    if (req.file) {
      // Delete old image
      if (food.image) fs.unlink(`uploads/${food.image}`, () => {});
      food.image = req.file.filename;
    }

    await food.save();
    res.json({ success: true, message: "Food item updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error updating food item" });
  }
};

export { addFood, listFood, removeFood, editFood };




