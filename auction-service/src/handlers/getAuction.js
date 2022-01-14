import AWS from "aws-sdk";
import commonMiddleware from "../middlewares/commonMiddleware";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getAuction = async (event, context) => {
  let auction;
  const { id } = event.pathParameters;

  try {
    const result = await dynamodb
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
      })
      .promise();

    auction = result.Item;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID: ${id} not found!`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(getAuction);
