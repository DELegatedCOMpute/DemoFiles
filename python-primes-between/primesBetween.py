"""
This function will find the primes between two 
input integers. 
Args:
    x: start (inclusive)
    y: end (inclusive)
Returns:
    count: number of primes between x and y
"""
def primesBetween(x, y):
    count = 0 
    for num in range(x, y + 1):
        if num > 1:
            for i in range(2, num):
                if (num % i) == 0:
                    break
            else:
                print(num)
                count += 1
    return count 