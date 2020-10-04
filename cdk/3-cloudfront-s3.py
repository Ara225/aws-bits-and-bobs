from aws_cdk import core
from aws_cdk import aws_s3
from aws_cdk import aws_s3_deployment
from aws_cdk import aws_cloudfront

class InfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        # S3 bucket for website content
        websiteBucket = aws_s3.Bucket(self, "websiteBucket",
                                      public_read_access=True,
                                      website_index_document="index.html",
                                      access_control=aws_s3.BucketAccessControl.PUBLIC_READ
                                      )

        # S3 bucket for uploaded image and video content. This is setup to be used to upload content which is to be viewed by the 
        # public. This can't be the same bucket as the website if you're using aws_s3_deployment as  aws_s3_deployment clears the 
        # bucket out before deploying
        imagesBucket = aws_s3.Bucket(self, "imagesBucket",
                                     public_read_access=True,
                                     access_control=aws_s3.BucketAccessControl.PUBLIC_READ
                                     )
        # Used to enable uploading to the S3 bucket directly from client side code. Pretty unnecessary otherwise, unless you want to get 
        # bucket listings from client side code
        imagesBucket.add_cors_rule(allowed_methods=[aws_s3.HttpMethods.GET, aws_s3.HttpMethods.PUT, aws_s3.HttpMethods.HEAD, 
        aws_s3.HttpMethods.POST, aws_s3.HttpMethods.DELETE], allowed_origins=["*"], allowed_headers=["*"], exposed_headers=["ETag"])

        # CloudFront distribution. Creates a combined front for the two buckets. The second bucket must have a folder called /media 
        # (name can be changed) containing all the stuff you want distributed. The content will appear under /media in the 
        # distribution. The one pitfall with this is that subfolders of the website bucket (e.g. /admin) don't redirect to their 
        # index.html properly. So, if /admin contains a index.html, navigating to /admin would get a 404 but /admin/index.html works 
        # fine
        distribution = aws_cloudfront.CloudFrontWebDistribution(self, "S3BucketDistribution",
                                                                        origin_configs=[
                                                                            aws_cloudfront.SourceConfiguration(
                                                                                s3_origin_source=aws_cloudfront.S3OriginConfig(
                                                                                    s3_bucket_source=websiteBucket
                                                                                ),
                                                                                behaviors=[aws_cloudfront.Behavior(
                                                                                    is_default_behavior=True)]
                                                                            ),
                                                                            aws_cloudfront.SourceConfiguration(
                                                                                s3_origin_source=aws_cloudfront.S3OriginConfig(
                                                                                    s3_bucket_source=imagesBucket
                                                                                ),
                                                                                behaviors=[aws_cloudfront.Behavior(
                                                                                    path_pattern="/media/*")]
                                                                            )
                                                                    ]
                                                                )

        # Code to automatically deploy the frontend code to the website bucket
        deployment = aws_s3_deployment.BucketDeployment(self, "deployStaticWebsite",
                                                        sources=[aws_s3_deployment.Source.asset(
                                                            "PATH_TO_FRONTEND_CODE")],
                                                        destination_bucket=websiteBucket,
                                                        distribution=distribution
                                                        )