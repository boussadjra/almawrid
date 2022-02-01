const defaultMessage = ' Using word of the day instead.'
//lazy import the with4Chars.ts file
import with4Chars from './list/with4Chars';
import with5Chars from './list/with5Chars';
import with6Chars from './list/with6Chars';
import with7Chars from './list/with7Chars';
import with8Chars from './list/with8Chars';
import with9Chars from './list/with9Chars';
import with10Chars from './list/with10Chars';
import { computed, ref, watch } from 'vue';


export default function useWord() {
//random number between 5 and 10
const randomNumber = Math.floor(Math.random() * (5 - 4 + 1)) +4;

  let charLength = ref(randomNumber)

// watch(charLength, (newValue, oldValue) => {
// console.log('--------------------')
// console.log('charLength changed from ' + oldValue + ' to ' + newValue)
// console.log('--------------------')
// })




  const answers :Record<number,Array<string>>= {
    4: with4Chars ,
    5: with5Chars,
    6: with6Chars,
    7: with7Chars,

    8: with8Chars,
    9: with9Chars,
    10: with10Chars,
  }



  return {
    charLength,
    answer: computed(()=>answers[charLength.value][Math.floor(Math.random() * answers[charLength.value].length)]).value,
    allWords: answers[charLength.value],
  }
}