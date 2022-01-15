import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export const closeAuction = async (auction) => {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  await dynamodb.update(params).promise();

  const { title, sellerEmail, highestBid } = auction;
  const { amount, bidderEmail } = highestBid;

  let notifySellerEmail, notifyBidderEmail;

  const successSoldMessage = {
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: `Your Auction Item was sold!`,
      recipient: sellerEmail,
      body: `Congratulations! The item you placed: "${title}" was sold for $${amount}. As per our Terms and Conditions, our Commision of $${
        amount / 20
      } will be deducted. We will credit the remaining amount of $${
        (19 * amount) / 20
      } to your registered Bank Account. Thank you for choosing us as your Auction Partner.`,
    }),
  };

  const failedSoldMessage = {
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: `Your Auction Item was not sold!`,
      recipient: sellerEmail,
      body: `We are Sorry! The item you placed: "${title}" remained unsold. If you wish to sell it once more kindly contact us and we will contact you with further steps. Thank you for choosing us as your Auction Partner.`,
    }),
  };

  if (amount > 0 && bidderEmail !== "") {
    notifySellerEmail = sqs.sendMessage(successSoldMessage).promise();

    notifyBidderEmail = sqs
      .sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: `Congratulations! Your bid was the highest!`,
          recipient: bidderEmail,
          body: `Congratulations! The item you you placed the bid on: "${title}" was the highest for $${amount}. As per our Terms and Conditions, along with our Commision of $${
            amount / 20
          }, a total of $${
            (21 * amount) / 20
          } will be deducted from your registered Bank Account. Thank you for choosing us as your Auction Partner.`,
        }),
      })
      .promise();
  } else {
    notifySellerEmail = sqs.sendMessage(failedSoldMessage).promise();
  }

  return Promise.all([notifySellerEmail, notifyBidderEmail]);
};
