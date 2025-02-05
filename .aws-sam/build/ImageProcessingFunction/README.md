# Serverless Photo Sharing Application

A serverless photo sharing application built with AWS services including Lambda, S3, DynamoDB, and API Gateway.

## Architecture

The application follows a serverless architecture with the following components:

- Frontend: React.js application
- Backend: AWS Lambda functions (Node.js 18.x)
- Storage: Amazon S3 for images, DynamoDB for metadata
- Authentication: Amazon Cognito
- API: Amazon API Gateway
- Image Processing: AWS Lambda with Sharp library

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS SAM CLI
- Docker (for local testing)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
sam local start-api
```

## Deployment

1. Build the SAM application:
```bash
sam build
```

2. Deploy to AWS:
```bash
sam deploy --guided
```

## Security

- API endpoints are secured with AWS Cognito
- S3 bucket access is controlled via pre-signed URLs
- Lambda functions follow the principle of least privilege
- Secrets are managed through GitHub Actions secrets

## License

MIT License
