pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    NODE_ENV = "development"
    APP_NAME   = "gatekeeper"
    AWS_REGION = "ap-south-1"
    ECR_REPO   = "personal/gatekeeper"
    AWS_ACCOUNT_ID = "058264153265"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install Dependencies") {
      steps {
        sh "pnpm install --frozen-lockfile"
      }
    }

    stage("Run Tests & Quality Checks") {
      steps {
        sh "pnpm test"
      }
    }

    /*
     * ==========================
     * RELEASE GUARD
     * ==========================
     * Everything below this point must only run when:
     * - branch == master
     * - NOT a Pull Request
     */

    stage("Build Docker Image") {
      when {
        allOf {
          branch "master"
          not { changeRequest() }
        }
      }
      steps {
        script {
          IMAGE_TAG = sh(
            script: "node -p \"require('./package.json').version\"",
            returnStdout: true
            ).trim()
        
          if (!IMAGE_TAG) {
            error("package.json version not found")
            }


          IMAGE_URI = "${APP_NAME}:${IMAGE_TAG}"

          COMMIT_SHA = sh(
            script: "git rev-parse HEAD",
            returnStdout: true
            ).trim()

          echo "Building ${APP_NAME}:${IMAGE_TAG} from commit ${COMMIT_SHA}"


          sh """
            docker build \
              -t ${IMAGE_URI} \
              .
          """
        }
      }
    }

    stage("Tag & Push to ECR") {
      when {
        allOf {
          branch "master"
          not { changeRequest() }
        }
      }
      steps {
        script {
          sh """
            aws ecr get-login-password --region ${AWS_REGION} \
            | docker login \
              --username AWS \
              --password-stdin \
              ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
          """

          sh """
            docker tag ${IMAGE_URI} \
              ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

            docker push \
              ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}
          """
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }

    failure {
      echo "❌ Pipeline failed"
    }

    success {
      echo "✅ Pipeline succeeded"
    }
  }
}
