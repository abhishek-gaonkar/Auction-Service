import middy from "@middy/core";
import validator from "@middy/validator";
import createError from "http-errors";
import httpErrorHandler from "@middy/http-error-handler";
import cors from "@middy/http-cors";
import { getAuctionById } from "./getAuction";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { pictureUrlToDynamoDB } from "../lib/pictureUrlToDynamoDB";
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema";

const uploadAuctionPicture = async (event, context) => {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionById(id);

  let updatedAuction;

  if (email === auction.sellerEmail) {
    const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    try {
      const pictureUrl = await uploadPictureToS3(auction.id + ".jpg", buffer);
      updatedAuction = await pictureUrlToDynamoDB(auction.id, pictureUrl);
    } catch (error) {
      console.log(error);
      throw new createError.InternalServerError(error);
    }
  } else {
    throw new createError.Forbidden(
      `Sorry! You are not the seller of this item`
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ inputSchema: uploadAuctionPictureSchema }))
  .use(cors());
