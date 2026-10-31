import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

export const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
     .cookie('token', token, options)
     .json({
       success: true,
       token,
       user: {
         id: user._id,
         _id: user._id,
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         role: user.role,
         avatar: user.avatar,
         isVerified: user.isVerified,
         currentTeam: user.currentTeam,
         teams: user.teams
       }
     });
};
