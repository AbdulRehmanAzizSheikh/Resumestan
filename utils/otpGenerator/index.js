const generateOTP = (length) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // 0-9 sab aa sakte hain
  }
  return otp;
};
export default generateOTP;
