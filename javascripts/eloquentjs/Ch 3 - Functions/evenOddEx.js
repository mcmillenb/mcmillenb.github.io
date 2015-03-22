function isEven(num) {
    // recursive function to return true if a given number is even and
    // false if it is odd. 
    if (num < 0) num *= -1; // if the number is negative, make it positive
    if (num == 1) return false;
    if (num == 0) return true;
    return isEven(num-2);
}

console.log(isEven(50));
console.log(isEven(75));
console.log(isEven(-1));