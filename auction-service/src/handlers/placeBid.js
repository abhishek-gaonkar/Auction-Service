import AWS from "aws-sdk";
import validator from "@middy/validator";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import placeBidSchema from "../lib/schemas/placeBidSchema";
import { getAuctionById } from "./getAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const placeBid = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  // If seller is the buyer
  if (auction.sellerEmail === email) {
    throw new createError.Forbidden(`You are not allowed to bid on your Item`);
  }

  // If Bidder is already the highest bidder
  if (auction.highestBid.bidderEmail === email) {
    throw new createError.Forbidden(
      `You are the current Highest Bidder with ${auction.highestBid.amount}`
    );
  }

  // Auction is not OPEN
  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(
      `Auction on ${auction.title} was Closed or is currently not taking bids!`
    );
  }

  // Amount bid is not greater than Highest Bid
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Your bid is less than the current highest bid: ${auction.highestBid.amount}`
    );
  }

  /**
   * UpdateExpression is processed
   * after consulting ExpressionAttributeValues
   * ReturnValues specifies what to do after operation
   */
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidderEmail = :bidderEmail",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidderEmail": email,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = commonMiddleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
    ajvOptions: {
      strict: false,
    },
  })
);
