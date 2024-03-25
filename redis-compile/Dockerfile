FROM ubuntu

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y gcc
RUN apt-get install -y make
RUN apt-get install -y git
RUN apt-get install -y xxd
RUN apt-get install -y pkg-config

WORKDIR /home

COPY make.sh /home/make.sh

CMD [ "bash", "make.sh" ]
