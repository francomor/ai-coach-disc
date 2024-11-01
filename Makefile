# INITIALIZATION
# ~~~~~~~~~~~~~~
# The following rules can be used to initialize the project for the first time.
# --------------------------------------------------------------------------------------------------

.PHONY: init install-front
init:
	poetry install
	pre-commit install

install-front:
	cd frontend
	npm install

seed-db:
	poetry run python seed_database.py

# DEVELOPMENT
# ~~~~~~~~~~~
# The following rules can be used during development
# --------------------------------------------------------------------------------------------------

.PHONY: backend frontend

backend:
	poetry run flask --app app --debug run

frontend:
	cd frontend
	npm start

# TESTING AND LINTING
# ~~~~~~~~~~~~~~~~~~~
# The following rules can be used to run tests, linters, etc.
# --------------------------------------------------------------------------------------------------

.PHONY:  pre-commit
pre-commit:
	poetry run pre-commit run --all-files

prettier:
	npx prettier frontend/. --write
