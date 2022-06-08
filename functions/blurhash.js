const parser = require('lambda-multipart-parser');
const { encode, decode } = require('blurhash');
const sharp = require('sharp');

exports.handler = async (event, context) => {
  const result = await parser.parse(event);

  const { data, info } = await sharp(result.files[0].content)
    .ensureAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true
    });

  const encoded = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  const decoded = decode(encoded, info.width, info.height);

  const image = await sharp(Buffer.from(decoded), {
    raw: {
      channels: 4,
      width: info.width,
      height: info.height,
    },
  })
    .jpeg({
      overshootDeringing: true,
      quality: 40,
    })
    .toBuffer();

  return {
    "statusCode": 200,
    "headers": {
      "Content-Type": "image/jpeg",
      "Content-Length": image.length
    },
    "isBase64Encoded": true,             // base64 is restriction imposed by API Gateway
    "body": image.toString('base64')   // image data encoded as base64 with padding
  }
};