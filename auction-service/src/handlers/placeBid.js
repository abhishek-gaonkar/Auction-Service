import AWS from "aws-sdk";
import commonMiddleware from "../middlewares/commonMiddleware";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const placeBid = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;

  const auction = await getAuctionById(id);

  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(
      `Auction ${auction.id} was Closed or is currently not taking bids!`
    );
  }

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
    UpdateExpression: "set highestBid.amount = :amount",
    ExpressionAttributeValues: {
      ":amount": amount,
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

export const handler = commonMiddleware(placeBid);
