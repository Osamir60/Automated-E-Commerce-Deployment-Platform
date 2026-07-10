pipeline {
    agent any

    parameters {
        // Allows manual triggering with the same intent as workflow_dispatch
        string(name: 'REASON', defaultValue: 'Manual run', description: 'Reason for manual trigger')
    }

    environment {
        AWS_REGION      = 'us-east-1'
        AWS_ACCOUNT_ID  = credentials('AWS_ACCOUNT_ID')       // Secret text credential
        EKS_CLUSTER_NAME = credentials('EKS_CLUSTER_NAME')    // Secret text credential
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG       = 'latest'
    }

    triggers {
        // Mirrors "on: push: branches: [main, master]"
        // Requires a webhook or SCM polling configured on the job/multibranch pipeline
        githubPush()
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Configure AWS Credentials') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins-creds'
                ]]) {
                    sh 'aws sts get-caller-identity'
                }
            }
        }

        stage('Build, Test, Push & Deploy per Service') {
            matrix {
                axes {
                    axis {
                        name 'SERVICE'
                        values 'frontend', 'product-service', 'cart-service', 'search-service', 'payment-service', 'email-service'
                    }
                }

                stages {

                    stage('Login to Amazon ECR') {
                        steps {
                            withCredentials([[
                                $class: 'AmazonWebServicesCredentialsBinding',
                                credentialsId: 'aws-jenkins-creds'
                            ]]) {
                                sh """
                                    aws ecr get-login-password --region ${AWS_REGION} \
                                    | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                                """
                            }
                        }
                    }

                    stage('Create ECR Repository if it does not exist') {
                        steps {
                            withCredentials([[
                                $class: 'AmazonWebServicesCredentialsBinding',
                                credentialsId: 'aws-jenkins-creds'
                            ]]) {
                                sh """
                                    aws ecr describe-repositories --repository-names ecomerrce2-${SERVICE} \
                                    || aws ecr create-repository --repository-name ecomerrce2-${SERVICE}
                                """
                            }
                        }
                    }

                    stage('Run Tests') {
                        tools {
                            nodejs 'node20' // Configure a NodeJS 20 tool in Jenkins Global Tool Configuration with this name
                        }
                        steps {
                            dir("${SERVICE}") {
                                sh '''
                                    if [ -f package.json ]; then
                                        npm install
                                        npm run test || echo "Tests finished with exit code or skipped."
                                    else
                                        echo "No package.json found. Skipping tests."
                                    fi
                                '''
                            }
                        }
                    }

                    stage('Build and Push Docker Image to ECR') {
                        steps {
                            sh """
                                echo "Building image for ${SERVICE}..."
                                docker build -t ${ECR_REGISTRY}/ecomerrce2-${SERVICE}:${IMAGE_TAG} ./${SERVICE}
                                echo "Pushing image to ECR..."
                                docker push ${ECR_REGISTRY}/ecomerrce2-${SERVICE}:${IMAGE_TAG}
                            """
                        }
                    }

                    stage('Setup Kubeconfig and Deploy') {
                        steps {
                            withCredentials([[
                                $class: 'AmazonWebServicesCredentialsBinding',
                                credentialsId: 'aws-jenkins-creds'
                            ]]) {
                                sh """
                                    aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}

                                    kubectl apply -f kubernetes/namespace.yaml

                                    if [ -f kubernetes/secrets.yaml ]; then
                                        kubectl apply -f kubernetes/secrets.yaml
                                    fi

                                    kubectl apply -f kubernetes/ingress.yaml

                                    kubectl apply -f kubernetes/mongodb/ || true

                                    echo "${ECR_REGISTRY}"

                                    kubectl apply -f kubernetes/${SERVICE}/
                                """
                            }
                        }
                    }

                    stage('Verify Deployment') {
                        steps {
                            withCredentials([[
                                $class: 'AmazonWebServicesCredentialsBinding',
                                credentialsId: 'aws-jenkins-creds'
                            ]]) {
                                sh """
                                    aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}

                                    echo "Restarting deployment..."
                                    kubectl rollout restart deployment/${SERVICE} -n ecom
                                    kubectl rollout status deployment/${SERVICE} -n ecom --timeout=180s
                                """
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo " Pipeline completed successfully for all services."
        }
        failure {
            echo "Pipeline failed. Check stage logs above."
        }
    }
}
