import Benchmark from 'benchmark'
import ArrayKeyedMap from '../../../src/map/classes/ArrayKeyedMap'

const sut = new ArrayKeyedMap()

// (new Benchmark.Suite)
// .add('ArrayKeyedMap#set with key.length == 2', () => {
//   sut.set([1, 2], 2)
// })
// .add('ArrayKeyedMap#set with key.length == 4', () => {
//   sut.set([1, 2, 3, 4], 4)
// })
// .on('cycle', function(event) {
//   console.log(String(event.target));
// })
// // run async
// .run({ 'async': true });

new Benchmark.Suite()
  .add('ArrayKeyedMap#get with key.length == 2', () => {
    sut.get([1, 2])
  })
  // .add('ArrayKeyedMap#get with key.length == 4', () => {
  //   sut.get([1, 2, 3, 4])
  // })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  // run async
  .run({ async: true })
