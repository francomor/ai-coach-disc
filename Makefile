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
	poetry run python -m backend.seed_database

# DEVELOPMENT
# ~~~~~~~~~~~
# The following rules can be used during development
# --------------------------------------------------------------------------------------------------

.PHONY: backend frontend

backend:
	poetry run flask --app backend.app --debug run

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


# ADMINISTRATION
# ~~~~~~~~~~~~~~
# The following rules can be used to perform administrative tasks.
# --------------------------------------------------------------------------------------------------

.PHONY: admin-scripts

admin-scripts:
	poetry run python -m scripts.admin_scripts
