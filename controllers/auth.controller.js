const UserModal = require('../models/user.model');
const jwtConfig = require('../config/jwt.config');
const cache = require('../utils/cache.util');
const jwt = require('../utils/jwt.util');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    const isExist = await UserModal.findOne({
        email: req.body.email
    })
    if(isExist) {
        return res.status(400).json({ message: 'Email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await UserModal.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    return res.json(user);
}

exports.login = async (req, res) => {
    const user = await UserModal.findOne({
        email: req.body.email
    });
    if (user) {
        const isMatched = await bcrypt.compare(req.body.password, user.password);
        if (isMatched) {
            const token = await jwt.createToken({ _id: user._id });
            return res.json({ 
                access_token: token,
                token_type: 'Bearer',
                expires_in: jwtConfig.ttl
            });
        }
    }
    return res.status(400).json({ message: 'Invalid credentails.' });
}

exports.getUser = async (req, res) => {
    const user = await UserModal.findById(req.user._id);
    return res.json(user);
}

exports.logout = async (req, res) => { 
    const token = req.token;
    const now = new Date();
    const expire = new Date(req.user.exp);
    const milliseconds = now.getTime() - expire.getTime();
    /* ----------------------------- BlackList Token ---------------------------- */
    await cache.set(token, token, milliseconds);

    return res.json({ message: 'Logged out successfully' });
}