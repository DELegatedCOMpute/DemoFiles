FROM ubuntu
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y xxd
COPY redis-compile.run.out redis-compile.run.out
RUN xxd -r redis-compile.run.out redis-server
RUN chmod +x redis-server
CMD ["bash"]
