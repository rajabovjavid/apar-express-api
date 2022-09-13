const S3 = require("aws-sdk/clients/s3");

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.getSignedUrl = (key, methodObject) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  if (methodObject === "putObject") params.ContentType = "image/*";

  // return s3.getSignedUrl(methodObject, params);

  return new Promise((resolve, reject) => {
    s3.getSignedUrl(methodObject, params, (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
  });
};

exports.isKeyExist = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };
  try {
    await s3.headObject(params).promise();
  } catch (error) {
    if (error.code === "NotFound") {
      return false;
    }
  }
  return true;
};
