import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import commonMiddleware from "../middlewares/commonMiddleware";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (event, context) => {
  const { title } = event.body;
  const now = new Date();
  const uuid_id = uuidv4();

  const auction = {
    id: uuid_id,
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    highestBid: {
      amount: 0,
    },
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

export const handler = commonMiddleware(createAuction);
