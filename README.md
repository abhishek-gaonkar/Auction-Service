# Serverless Architecture based Auction Project

Using AWS's Lambda, DynamoDB, S3, SES, SQS, API Gateway, etc., a Server-less Architecture Project has been written. The Auction Service works as a Microservice, not as a Monolithic Application. Since it uses the Cloud strategy of deployment, it uses Serverless framework and YAML style definition of code

## Architecture

Below is a simple architecture
<img src="docs/sls_service.jpg">

## Requirements

- AWS Account
- AWS-CLI v2
- NodeJS (ver. < 15.3.x) and npm
- serverless framework (`npm install -g serverless`)
- Configuring aws locally (`aws configure`)
- Postman or Thunder-Client(plugin for VS-Code)

## Getting started

`cd auction-service`
`npm install`
`serverless deploy --verbose`
