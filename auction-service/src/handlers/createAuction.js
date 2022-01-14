import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (event, context) => {
  const { title } = JSON.parse(event.body);
  const now = new Date();
  const uuid_id = uuidv4();

  const auction = {
    id: uuid_id,
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
  };

  await dynamodb
    .put({
      TableName: "AuctionsTable",
      Item: auction,
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = createAuction;
