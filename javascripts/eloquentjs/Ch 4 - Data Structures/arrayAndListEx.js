function arrayToList(array){
  if (array.length < 1) return {};
  
  var list = { value: array[0], rest: null };
  var prevItem = list;
  
  for (var i = 1; i < array.length; i++){
    var item = { value: array[i], rest: null };
    if (prevItem) prevItem.rest = item;
    prevItem = item;
  }
  return list;
}

function listToArray(list){
  var array = [];
  var item = list;
  
  for (var i = 0; item.rest; i++){
    array[i] = item.value;
    item = item.rest;
  }
  array[i++] = item.value; // get the last item;
  
  return array;
}

function prepend(val, list){
  return { value: val, rest: list }
}

function nth(list, index){
  if (index < 0) return undefined;
  if (!list) return undefined;
  if (index === 0) return list.value;
  var i = 0;
  var item = list;
  
  do{
    if (!item.rest) return undefined;
    item = item.rest;
    i++;
  } while (i < index)
    
  return item.value;
}

console.log(arrayToList([10, 20]));
// → {value: 10, rest: {value: 20, rest: null}}
console.log(listToArray(arrayToList([10, 20, 30])));
// → [10, 20, 30]
console.log(prepend(10, prepend(20, null)));
// → {value: 10, rest: {value: 20, rest: null}}
console.log(nth(arrayToList([10, 20, 30]), 0));
// → 20