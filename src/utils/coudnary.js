import {v2 as cloudinary} from "cloudinary"

import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINERY_NAME, 
    api_key: process.env.CLOUDINERY_API_KEY, 
    api_secret: process.env.CLOUDINERY_API_SECRET
});

const uploadOnCloudinery  =async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response= await cloudinary.uploader.upload(localFilePath,{resource_type :"auto"})
        // file hass been uploaded successfull
        console.log("file is uploaded on cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved emporrary file as the upload operation got failed 
        return null;
    }
}

export {uploadOnCloudinery}