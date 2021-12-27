const S3 = require("aws-sdk/clients/s3");

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const getSignedUrl = async (key, methodObject) => {
  const tempObject = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  if (methodObject === "putObject") tempObject.ContentType = "image/*";

  const url = await s3.getSignedUrl(methodObject, tempObject);
  return url;
};

module.exports = getSignedUrl;
