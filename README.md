# AI Persona
This is AI Persona by GUT.

## How to use
1. Install Python 3.6 or higher
2. Install pip
3. Install requirements
```
pip install -r requirements.txt
```
4. Run backend
First you need to initialize the database:

```
from yourapplication import init_db
init_db()
```

Then you can run the application:
```
flask --app app run 
```
5. Run frontend
```
cd frontend
npm install
npm start
```

6. Gunicorn
```
gunicorn --config gunicorn_config.py app:app
```
