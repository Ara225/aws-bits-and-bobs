const core = require("@aws-cdk/core");
const rds = require('@aws-cdk/aws-rds');
const ssm = require('@aws-cdk/aws-ssm');
const ec2 = require('@aws-cdk/aws-ec2');

class Stack extends core.Stack {
    /**
     *
     * @param {core.Construct} scope
     * @param {string} id
     * @param {core.StackProps} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);
        /* Option 1 for VPC - a completely isolated subnet. If you don't need to import or access the data 
           manually this is probably the best option vpcPlacement below would need changed to 
        //   { subnetType: ec2.SubnetType.ISOLATED },
        var vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            subnetConfiguration: [{
                name: 'IsolatedSubnet',
                subnetType: ec2.SubnetType.ISOLATED,
            }],
        });*/

        // Option 2 - Places the RDS in a private subnet
        var vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            subnetConfiguration: [{
                name: 'privateSubnet',
                subnetType: ec2.SubnetType.PRIVATE,
            }],
        });

        /* Option 3 - this allows you to  place the RDS in the private subnet and spin up a Cloud 9 instance 
           in the public subnet to access the DB. 
        var vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            subnetConfiguration: [{
                name: 'privateSubnet',
                subnetType: ec2.SubnetType.PRIVATE,
            }, {
                name: 'publicSubnet',
                subnetType: ec2.SubnetType.PUBLIC,
            }],
        });
        // RDS security group to enable servers in the public subnet to talk to the DB Can be disabled for other options
        var RDSSecurityGroup = new ec2.SecurityGroup(this, 'ingress-security-group', {
            vpc: vpc,
            allowAllOutbound: false,
        });
        // Allow only servers in the same IP range to talk to the DB and only on the DB port
        RDSSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(3306));
        RDSSecurityGroup.addDefaultEgressRule()*/


        /* Option 4 - this puts the RDS in a public subnet vpcPlacement below would need changed to 
           { subnetType: ec2.SubnetType.PUBLIC }, You'd also need some SecurityGroups to make this work
        var vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            subnetConfiguration: [{
                name: 'publicSubnet',
                subnetType: ec2.SubnetType.PUBLIC,
            }],
        });*/
        
        // Assumes you've got a SSM SecureStringParameter set up already. 
        var secret = ssm.StringParameter.valueForSecureStringParameter(this, 'rds-db-pwd', 1);
        // Create RDS DB
        var mySQLRDSInstance = new rds.DatabaseInstance(this, 'test-db', {
            engine: rds.DatabaseInstanceEngine.MYSQL,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO), // free tier
            vpc: vpc,
            vpcPlacement: { subnetType: ec2.SubnetType.PRIVATE }, // Subnet type to put DB into 
            multiAz: false,
            allocatedStorage: 5, // 5GB
            storageType: rds.StorageType.standard,
            deletionProtection: false,
            masterUsername: 'Admin',
            //securityGroups: [RDSSecurityGroup], - uncomment if using option 3
            databaseName: 'testDB',
            masterUserPassword: secret,
            port: 3306
        });

        // Create simple, publicly available API gateway resource. The CORS stuff is only for preflight requests
        var api = new apigateway.RestApi(this, 'testAPI', {restApiName:'testAPI',
                                                defaultCorsPreflightOptions: {
                                                    allowOrigins: ["*"],
                                                    allowMethods: ["GET", "POST", "OPTIONS"]
                                                }})
        // Set up Lambda environment vars to enable it to connect
        var lambdaEnvVars = {
            RDS_USERNAME: 'Admin',
            RDS_ENDPOINT: mySQLRDSInstance.dbInstanceEndpointAddress,
            RDS_DATABASE: 'testDb',
            RDS_PORT: '3306',
            RDS_PASSWORD_PARAM: 'rds-db-pwd'
        }
        // Adds resource (path) to API
        var testLambdaResource = api.root.addResource('test')
        var testLambda = new lambda.Function(this, "testLambda", {
            timeout: core.Duration.seconds(10), // limit execution time to ten second
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: "app.handler",
            code: lambda.Code.fromAsset('PATH_TO_LAMBDA'),
            vpc: vpc,
            vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE}, // place in private subnet alongside DB
            environment: lambdaEnvVars
        });
        // Grant the lambda permissions to get the parameter. For some reason, the lambda won't get the value properly 
        // if it's set as an env var
        testLambda.addToRolePolicy(new iam.PolicyStatement({actions:["ssm:GetParameter"], resources: ["arn:aws:ssm:eu-west-2:040684591284:parameter/rds-db-pwd"]}))
        // Add lambda integration to resource
        var testLambdaIntegration = new apigateway.LambdaIntegration(testLambda, {proxy:true})
        testLambdaResource.addMethod('GET', testLambdaIntegration)
    }
}