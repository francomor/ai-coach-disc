FROM python:3.11.8
#RUN mkdir /backend
#WORKDIR /backend
#COPY requirements.txt /backend/requirements.txt
#RUN pip install --upgrade pip && \
#    pip install -r requirements.txt
#COPY . .

ENV CONTAINER_HOME=/var/www
WORKDIR $CONTAINER_HOME

ADD server/requirements.txt .

# keep the parent server directory structure for relative imports
RUN mkdir server
ADD server $CONTAINER_HOME/server

RUN pip install --no-cache-dir -r requirements.txt
