from aws_cdk import core
from aws_cdk import aws_apigateway
from aws_cdk import aws_lambda

class InfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        # Create simple, publically available API gateway resource, with CORS on preflight requests
        api = aws_apigateway.RestApi(self, 'testAPI', rest_api_name='testAPI',
                                     default_cors_preflight_options={
                                         "allow_origins": ["*"],
                                         "allow_methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
                                     })
        # Create a COGNITO_USER_POOLS Authorizer to use with the API
        auth = aws_apigateway.CfnAuthorizer(
                                                self, 
                                                "testAuth", 
                                                rest_api_id=api.rest_api_id,
                                                type='COGNITO_USER_POOLS', 
                                                identity_source='method.request.header.Authorization',
                                                provider_arns=[
                                                    'arn:aws:cognito-idp:...'
                                                ],
                                                name="testAuth"
                                            )
        # Add a resource (path) to the API
        resource = api.root.add_resource("endpoint")
        # Create lambda
        lambda_function = aws_lambda.Function(
                                                  self, 
                                                  "lambdaFunction",
                                                  handler='app.lambda_handler',
                                                  runtime=aws_lambda.Runtime.PYTHON_3_8,
                                                  code=aws_lambda.Code.from_asset(
                                                      "path/to/code"
                                                  )
                                              )
        # Lambda integration
        lambda_integration = aws_apigateway.LambdaIntegration(lambda_function, proxy=True)
        method = resource.add_method("GET", lambda_integration)
        # Get the Resource subkey of the method
        method_resource = method.node.find_child('Resource')
        # Override the properties
        method_resource.add_property_override('AuthorizationType', 'COGNITO_USER_POOLS')
        method_resource.add_property_override('AuthorizerId', {"Ref": auth.logical_id})
