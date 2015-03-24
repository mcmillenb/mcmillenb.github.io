function Sequence(elements){
  this.elements = elements;
}

function logFive(sequence){
  for (var i = 0; i < 5; i++){
    console.log(sequence.elements[i]);
    if (i+1>=sequence.elements.length) return;
  }
}

function ArraySeq(array){
  Sequence.call(this, array);
}

function RangeSeq(min, max){
  var array = [];
  for (var i = min; i <= max; i++)
    array[i-min] = i;
  Sequence.call(this, array);
}

logFive(new ArraySeq([1, 2]));
// → 1
// → 2
logFive(new RangeSeq(100, 1000));
// → 100
// → 101
// → 102
// → 103
// → 104