# Overview
A collection of examples of how to do stuff with AWS tools and services in Python and/or Javascript. Focuses on the CDK and serverless tooling. Some of these have a corresponding blog on my account at <a href="https://dev.to/ara225">https://dev.to/ara225</a>

These aren't fully fledged templates, instead each one is a well explained example of how to do one specific thing that you can copy paste into your code or use to build your understanding. I personally find that the complete application examples provided by AWS can be a bit overwhelming when you're first figuring things out. 

I'm not a particular expert on this stuff, I'm just really into it, so take the stuff here with a pinch of salt and feel free to correct me if I'm wrong. Pull requests are more than welcome.

# CDK Examples
1. 1-rds-with-lambda.js - Example showing how to create a RDS in a private subnet and a Lambda in the same subnet. Variation of code I used on my <a href="https://github.com/Ara225/house-price-index-api">house price index API project</a>
2. 2-api-gateway-cognito-auth.py - Example showing how to add a Cognito authorizer to a API Gateway. Variation of code I used on a project <a href="https://github.com/Ara225/rescue-center-website/blob/master/backend/infrastructure/infrastructure_stack.py">here</a>
3. 3-cloudfront-s3.py - Putting multiple S3 buckets behind a single Cloudfront distribution. Variation of <a href="https://github.com/Ara225/rescue-center-website/blob/master/backend/infrastructure/infrastructure_stack.py">code here</a>