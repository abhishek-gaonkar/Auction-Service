import AWS from "aws-sdk";

const ses = new AWS.SES({ region: "us-east-1" });

const sendMail = async (event, context) => {
  const record = event.Records[0];
  console.log("record: ", record);

  const email = JSON.parse(record.body);
  const { subject, body, recipient } = email;

  const params = {
    Source: "abhishekpgaonkar987@gmail.com",
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log("result: ", result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

export const handler = sendMail;
