from hashlib import sha256

def getSHA256Between(lower, upper):
  for num in range(lower, upper + 1):
    num_text = str(num)
    print(str(sha256(num_text.encode('utf-8')).hexdigest())[0])

# getSHA256Between(1, 10)
getSHA256Between(1, 10_000_000)
