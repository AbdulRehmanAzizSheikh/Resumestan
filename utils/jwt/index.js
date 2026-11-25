import jsonwebtoken from "jsonwebtoken";

export const generateToken = (data,expiresInSeconds,) => {
  const secret = process.env.JWT_SECRET;

  if (expiresInSeconds) {
    return jsonwebtoken.sign(data, secret, { expiresIn: expiresInSeconds });
  }
  return jsonwebtoken.sign(data, secret);
};

export const decodeToken = (token) => {
  const secret = process.env.JWT_SECRET;
  return jsonwebtoken.verify(token, secret);
};