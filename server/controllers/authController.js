import User from '../models/user.js';
import generateTokenAndSetCookie from "../utils/generateToken.js";
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// Send OTP function
const sendOtp = async (mobile, otp) => {
  const url = `https://smpp.revesms.com:7790/sendtext?apikey=2e2d49f9273cc83c&secretkey=f4bef7bd&callerID=1234&toUser=${mobile}&messageContent=Your OTP is ${otp}`;
  await axios.get(url);
};

export const registerUser = async (req, res) => {
  const { mobile } = req.body;

  // Validate mobile number
  if (!mobile || !/^\+880[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Invalid mobile number' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      // If OTP has expired, regenerate OTP
      if (existingUser.otpExpires < Date.now()) {
        const otp = crypto.randomInt(100000, 999999).toString();
        existingUser.otp = otp;
        existingUser.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        await existingUser.save();
        await sendOtp(mobile, otp);
        return res.status(200).json({ message: 'OTP sent to mobile', userId: existingUser._id });
      }
      return res.status(200).json({
        message: 'OTP already sent, please check your mobile',
        userId: existingUser._id
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    // Create new user
    const user = new User({
      mobile,
      email: undefined, // Ensure email is either a string or undefined
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000 // OTP expires in 10 minutes
    });



    // Save user to the database
    await user.save();

    // Send OTP via SMS
    generateTokenAndSetCookie(user._id, res);
    // await sendOtp(mobile, otp);

    res.status(201).json({
      message: 'User registered, OTP sent to mobile',
      userId: user._id
    });
  } catch (error) {
    if (error instanceof mongoose.Error && error.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ message: 'Mobile number or email already exists' });
    }
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};


export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.otp = null; // Clear OTP
    user.otpExpires = null; // Clear OTP expiry time
    user.isActive = true; // Activate user
    await user.save();

    res.status(200).json({ message: 'OTP verified, account activated' });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};


export const setPassword = async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'User not found or not active' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Error in setPassword:', error);
    res.status(500).json({ message: 'Error setting password', error: error.message });
  }
};


export const loginUser = async (req, res) => {
  const { mobile, password } = req.body;
  const fullMobileNumber = `+88${mobile}`

  try {
    // Find user by mobile number
    const user = await User.findOne({ mobile: fullMobileNumber });
    // console.log('user:',user);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account not activated' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token and set cookie
    generateTokenAndSetCookie(user._id, res);

    // Successful login
    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const getUserByMobile = async (req, res) => {
  const { mobile } = req.query;

  try {
    const user = await User.findOne({ mobile }).select('mobile'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ mobile: user.mobile });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};


// Controller for logout
export const logout = (req, res) => {
  try {
  res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming the ID is passed as a URL parameter
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      // verified: user.verified,
      isActive: user.isActive,
      // profilePic:user.profilePic
    });
  } catch (error) {
    console.log("Error in getUserById controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// register admin
export const registerAdmin = async (req, res) => {
  const { fullName, mobile, email, password, gender } = req.body;
  console.log(mobile);

  try {
    // Check if the user already exists by mobile number
    let user = await User.findOne({ mobile });

    if (user) {
      return res.status(400).json({ msg: 'User already exists with this mobile number' });
    }

    // Hash the password before saving to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the admin role
    user = new User({
      fullName,
      mobile,
      email,
      gender,
      password: hashedPassword,
      role: 'admin',  // Set role to admin
      isActive: true  // Optionally set the account as active
    });

    // Save the user to the database
    await user.save();

    // Respond with success message
    res.status(201).json({ msg: 'Admin registered successfully' });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account not activated' });
    }

    // Check if the user has the admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admins only' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token and set cookie
    generateTokenAndSetCookie(user._id, res);

    // Successful login
    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Error in loginAdmin:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};