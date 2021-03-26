FROM python:3
COPY . /usr/src/app
WORKDIR /usr/src/app


RUN pip install -r requirements.txt
