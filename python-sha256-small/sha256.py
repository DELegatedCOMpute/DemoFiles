from hashlib import sha256

def getSHA256Between(lower, upper):
  val = 0
  for num in range(lower, upper + 1):
    num_text = str(num)
    val ^= int.from_bytes(sha256(num_text.encode('utf-8')).digest(), 'big')
  return val

# getSHA256Between(1, 10)
# print(getSHA256Between(1, 100_000_000))
