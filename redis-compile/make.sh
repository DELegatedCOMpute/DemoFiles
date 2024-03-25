PROG_ONLY=0

if [ $PROG_ONLY -eq 1 ]; then
  git clone https://github.com/redis/redis.git -q
  cd redis
  echo here1
  make --silent distclean
  echo here2
  make --silent
  echo here3
  xxd src/redis-server
else
  echo cloning...
  echo

  git clone https://github.com/redis/redis.git
  cd redis

  echo
  echo cloned, cleaning
  echo

  make distclean

  echo
  echo cleaned, making
  echo

  make

  echo
  echo done making, printing file
  
  echo --------------------------------------------------
  xxd src/redis-server
fi
