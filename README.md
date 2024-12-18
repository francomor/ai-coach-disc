# AI coach DISC
AI coach DISC is a web application that helps users to understand their personality type and improve their communication skills. The application is based on the DISC model, which is a behavior assessment tool based on the work of psychologist William Moulton Marston. The DISC model classifies four personality types: Dominance, Influence, Steadiness, and Conscientiousness.

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

Copy with FileZilla all files to EC2 instance nd run the following commands:

```bash
sudo yum update -y
sudo yum -y install python-pip
sudo yum install poppler-utils
pip install gunicorn
cd backend
pip install -r requirements.txt
cd ..
gunicorn -b 0.0.0.0:8000 backend.app:app --timeout 260
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
