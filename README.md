# AI Persona
AI Persona is a multi-purpose AI chatbot platform designed to enhance user interactions. The project consists of a Flask-based backend and a React frontend.

## Prerequisites
* Python 3.6 or higher
* Poetry
* Node.js & npm
* Pre-commit

## Installation
To set up the project, run the following command:
```bash
make init
```

## Usage
To run the backend and frontend servers, follow the steps below.

### Backend
To start the Flask backend in development mode:
```bash
make backend
```

### Frontend
To start the React frontend:
```bash
make frontend
```

## Database Seeding
If you need to seed the database with initial data, run

```bash
make seed-db
```

## Linting
To run the tests and linters, execute the following command:
```bash
make pre-commit
make prettier
```


# Deploy to EC2
https://github.com/baibhavsagar/Deploy-Flask-App-on-AWS-EC2-Instance

Run:
```bash
poetry export --without-hashes -o backend/requirements.txt
```

Copy with FileZilla all files to EC2 instance

SSH:

```bash
ssh -i ai-coach-thomas.pem ec2-user@18.231.195.47
```

Commands:
```bash
sudo yum update -y
sudo yum -y install python-pip
pip install gunicorn
cd backend
pip install -r requirements.txt
cd ..
gunicorn -b 0.0.0.0:8000 backend.app:app
```

Tmux:
```bash
tmux a
gunicorn -b 0.0.0.0:8000 backend.app:app
```

Amazon Linux NGINX:
```bash
sudo yum install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo nano -p /etc/nginx/conf.d/default.conf
sudo systemctl restart nginx
sudo systemctl status nginx
```
