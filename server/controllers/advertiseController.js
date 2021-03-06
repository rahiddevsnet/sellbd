const fs = require('fs')
const cloudinary = require('../utils/cloudinary')
const Advertise = require('../model/advertiseModel')
var mongoose = require('mongoose');

// post an advertise
const postAd = async (req, res) => {

    const { division, area, category, condition, title, description, price, isNegotiable } = req.body

    if (!division || !area || !category || !condition || !title || !description || !price || !isNegotiable) {
        return res.json({
            msg: "please fill all the fileds"
        })
    }

    // upload photos to cloudinary
    const uploader = async (path) => await cloudinary.uploads(path, 'images');

    try {
        if (req.method === 'POST') {
            const urls = []
            const files = req.files;
            console.log(`file is ${files}`)
            if (!files) {
                return res.json({
                    msg: "Please provide images"
                })
            }
            for (const file of files) {
                const { path } = file;
                const newPath = await uploader(path)
                urls.push(newPath)
                fs.unlinkSync(path)
            }
            // for(let i=0; i <= 50; i++){
            console.log(req.user.id)
            const advertise = new Advertise({
                user: req.user.id,
                division: division,
                area: area,
                category: category,
                images: urls,
                condition: condition,
                title: title,
                description: description,
                price: price,
                isNegotiable: isNegotiable
            })
            await advertise.save();
            // }

            res.status(201).json({ 
                msg: 'Posted advertise successfully',
            })
        } else {
            res.json({
                msg: `${req.method} method not allowed`
            })
        }
    } catch (err) {
        if (err) {
            console.log(err)
        }
    }
}

// get all ads with pagination and filtering
const getAllAds = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { division, area, category, price, searchKeyword } = req.body;

        let filterData = {};
        if (division) {
            filterData.division = new RegExp(division, "i")
        }
        if (area) {
            filterData.area = new RegExp(area, "i")
        }
        if (category) {
            filterData.category = new RegExp(category, "i")
        }
        if (price) {
            filterData.price = { $gte: price }
        }

        if (searchKeyword) filterData.title = new RegExp(searchKeyword, "i");

        const ads = await Advertise.find(filterData).limit(limit * 1).skip((page - 1) * limit).populate({
            path: 'user',
            select: '-password -verificationCode'
        })
        const count = await Advertise.countDocuments()

        res.status(200).json({
            ads,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        console.log(err.message);
    }
}

// get single ad by id 
const getAdById = async (req, res) => {
    let {id} = req.params
    
    let isValid  = mongoose.Types.ObjectId.isValid(id);
    
    try {
        if(!isValid){
            return res.json({
                success: false,
                msg: "Invalid id"
            })
        }
        const result = await Advertise.findById(id).populate({
            path: 'user',
            select: '-password -verificationCode'
        })
        res.status(200).json(result)
    } catch (err) {
        console.log(err.message);
    }
}

// get all ads by user id
const getAllAdsByUser = async (req, res) => {
    try {
        const { id } = req.user.id
        const result = await Advertise.find({ user: id })
        if (!result) {
            return res.json({ msg: 'Currently you have no ads' })
        }
        res.json(result)
        console.log(result.length)
    } catch (err) {
        console.log(err.message);
    }
}

// show related ads depends on single ad title 
const relatedAds = async (req, res) => {

    try {
        console.log(req.body.title)
        let result;
        result = await Advertise.find({ title: new RegExp(req.body.title, "i") }).limit(10).populate({
            path: 'user',
            select: '-password -verificationCode'
        })
        if (!result) {
            result = await Advertise.find().limit(10)
        }
        res.json(result)
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = { postAd, getAllAds, getAdById, getAllAdsByUser, relatedAds }