const S3 = require("aws-sdk/clients/s3");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

exports.getSignedUrl = catchAsync(async (req, res, next) => {
  let key;
  if (req.query.key === "user_image") {
    key = `user-images/${req.user.id}.jpeg`;
  } else if (req.query.key === "user_id_image") {
    key = `user-ids/${req.user.id}.jpeg`;
  } else if (req.query.key === "package_image") {
    key = `packages/${req.query.shipment_id}.jpeg`; // if there is many images in one package then?
  } else {
    return next(new AppError("you can't get signed url for this", 400));
  }

  const url = await s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    ContentType: "image/jpeg",
    Key: key,
  });

  res.send({ key, url });
});
