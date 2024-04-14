"""
This function will find the primes between two 
input integers. 
Args:
    x: start (inclusive)
    y: end (inclusive)
Returns:
    count: number of primes between x and y
"""
def primesBetween(x, y, printEach):
    count = 0 
    for num in range(x, y + 1):
        if num > 1:
            if (num == 2):
              if printEach:
                print(num)
              count += 1
              continue
            elif (num % 2 == 0):
              continue
            for i in range(3, (num // 2) + 1, 2):
                if (num % i) == 0:
                    break
            else:
                if printEach:
                  print(num)
                count += 1
    return count