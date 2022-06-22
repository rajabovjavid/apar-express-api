const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;
const client = require("twilio")(accountSid, authToken);

exports.sendSmsVerification = async (to) => {
  const twilioRes = await client.verify
    .services(serviceId)
    .verifications.create({ to, channel: "sms" });

  return twilioRes;
};

exports.checkSmsVerification = async (to, code) => {
  const twilioRes = await client.verify
    .services(serviceId)
    .verificationChecks.create({ to, code });

  return twilioRes;
};
