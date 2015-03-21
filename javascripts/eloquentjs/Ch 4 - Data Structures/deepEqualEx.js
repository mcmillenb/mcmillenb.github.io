function deepEqual(x, y){
  if ( typeof(x) === "object" && x !== null )
  {  
    if ( typeof(y) === "object" && y !== null ){
      if (x.length !== y.length) return false; // check the objects' properties 
      for (var prop in x){						   // if both x and y are objects
        return deepEqual(x[prop], y[prop]);
      }
    }
    else return false; // if one is an object and one isn't then false
  }
  else{
    return (x === y);  // if both aren't objects check if they're equal
  }
}

var obj = {here: {is: "an"}, object: 2};
console.log(deepEqual(obj, obj));
// → true
console.log(deepEqual(obj, {here: 1, object: 2}));
// → false
console.log(deepEqual(obj, {here: {is: "an"}, object: 2}));
// → true