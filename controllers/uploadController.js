const S3 = require("aws-sdk/clients/s3");
const catchAsync = require("../utils/catchAsync");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

exports.uploadUserImage = catchAsync(async (req, res) => {
  const key = `user-images/${req.user.id}.jpeg`;

  const url = await s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    ContentType: "image/jpeg",
    Key: key,
  });

  res.send({ key, url });
});

exports.uploadUserIdImage = catchAsync(async (req, res) => {
  const key = `user-ids/${req.user.id}.jpeg`;

  const url = await s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    ContentType: "image/jpeg",
    Key: key,
  });

  res.send({ key, url });
});
