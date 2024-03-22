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

xxd src/redis-server
