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
