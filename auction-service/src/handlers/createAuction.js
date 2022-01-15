import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import validator from "@middy/validator";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (event, context) => {
  const { title } = event.body;
  const { email } = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction = {
    id: uuidv4(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
      bidderEmail: "",
    },
    sellerEmail: email,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(createAuction).use(
  validator({
    inputSchema: createAuctionSchema,
    ajvOptions: {
      strict: false,
    },
  })
);
