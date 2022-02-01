
<template>
  <Transition>
    <div
      class="px-8 text-white bg-[#083418] shadow-2xl message"
      :class="{ 'bg-[#d24237]': error }"
      v-if="message"
    >
      {{ message }}
      <pre v-if="grid" dir="rtl">{{ grid }}</pre>
    </div>
  </Transition>
  <header>
    <nav dir="rtl" class="flex items-center justify-between w-full h-16 px-8">
      <h1 class="font-bold text-green-600">المورد</h1>

      <div>
        <button @click="changeColorMode">
          <IconSun v-if="colorMode == 'light'" />
          <IconMoon v-else />
        </button>
      </div>
    </nav>
  </header>
  <div id="board" dir="rtl">
    <div
      v-for="(row, index) in board"
      :class="[
        'grid  gap-2', gridColsClass,
        shakeRowIndex === index && 'shake',
        success && currentRowIndex === index && 'jump'
      ]"
    >
      <div
        v-for="(tile, index) in row"
        :class="['tile w-8', tile.letter && 'filled', tile.state && 'revealed']"
      >
        <div class="front" :style="{ transitionDelay: `${index * 300}ms` }">{{ tile.letter }}</div>
        <div
          :class="['back', tile.state]"
          :style="{
            transitionDelay: `${index * 300}ms`,
            animationDelay: `${index * 100}ms`
          }"
        >{{ tile.letter }}</div>
      </div>
    </div>
  </div>
  <Keyboard @key="onKey" :letter-states="letterStates" />
  <!-- footer -->
  <footer class="flex items-center justify-center px-8 py-2 text-sm">
<div>
  Developed with ❤️ by <a href="https://twitter.com/IbraBoussadjra" target="_blank" class="px-2 text-blue-500">@Brahim Boussadjra</a> based on original work by <a href="https://github.com/yyx990803/vue-wordle" target="_blank" class="px-2 text-blue-500">Evan You</a>

<!-- anchor with image to new tab -->
<div class="flex justify-center w-full py-2 ">
  <a target="_blank" href="https://www.buymeacoffee.com/boussadjra" >
  <img height="12" class="h-10" src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=boussadjra&button_colour=16a34a&font_colour=fff&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/boussadjra"/>
</a>
</div>
</div>  
  
  </footer>
</template>


<script setup lang="ts">
import { onUnmounted, onMounted } from 'vue'
// import { getWord, allWords } from './words'
import useWord from './words';
import Keyboard from './Keyboard.vue'
import { LetterState } from './types'
import IconSun from './icons/IconSun.vue';
import IconMoon from './icons/IconMoon.vue';
import IconRefresh from './icons/IconRefresh.vue';


let { answer, charLength, allWords } = useWord();

function changeCharLength(_charLength:number){
  console.log(_charLength);
charLength.value = _charLength;
  // answer.reset();

}

let cols: Record<number, string> = {
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',


}


// const gridCols = $ref(5)
const gridColsClass = $computed(() => cols[charLength.value])



// Board state. Each tile is represented as { letter, state }
let board = $ref(
  Array.from({ length: 6 }, () =>
    Array.from({ length: charLength.value }, () => ({
      letter: '',
      state: LetterState.INITIAL
    }))
  )
)



// Current active row.
let currentRowIndex = $ref(0)
let currentRow = $computed(() => board[currentRowIndex])


let score = $ref(0)
// Feedback state: message and shake
let message = $ref('')
let grid = $ref('')
let shakeRowIndex = $ref(-1)
let success = $ref(false)
let error = $ref(false)



// Keep track of revealed letters for the virtual keyboard
let letterStates: Record<string, LetterState> = $ref({})

// Handle keyboard input.
let allowInput = true

const onKeyup = (e: KeyboardEvent) => onKey(e.key)

window.addEventListener('keyup', onKeyup)

onUnmounted(() => {
  window.removeEventListener('keyup', onKeyup)
})

function onKey(key: string) {
  let arabic = /[\u0600-\u06FF]/g
  if (!allowInput) return
  if (key.match(arabic)) {
    fillTile(key.toLowerCase())
  } else if (key === 'Backspace') {
    clearTile()
  } else if (key === 'Enter') {
    completeRow()
  }
}

function fillTile(letter: string) {
  for (const tile of currentRow) {
    if (!tile.letter) {
      tile.letter = letter
      break
    }
  }
}

function clearTile() {
  for (const tile of [...currentRow].reverse()) {
    if (tile.letter) {
      tile.letter = ''
      break
    }
  }
}

function completeRow() {
  if (currentRow.every((tile) => tile.letter)) {
    const guess = currentRow.map((tile) => tile.letter).join('')
    if (!allWords.includes(guess) && guess !== answer) {
      shake()
      error = true
      showMessage(`الكلمة غير موجودة في القائمة`)
      return
    } else {
      error = false

    }

    const answerLetters: (string | null)[] = answer.split('')
    // first pass: mark correct ones
    currentRow.forEach((tile, i) => {
      if (answerLetters[i] === tile.letter) {

        tile.state = letterStates[tile.letter] = LetterState.CORRECT
        answerLetters[i] = null
        //set score based on the current row index
        score += 100 * (6 - currentRowIndex)
      }
    })
    // second pass: mark the present
    currentRow.forEach((tile) => {
      if (!tile.state && answerLetters.includes(tile.letter)) {
        tile.state = LetterState.PRESENT
        answerLetters[answerLetters.indexOf(tile.letter)] = null
        if (!letterStates[tile.letter]) {
          letterStates[tile.letter] = LetterState.PRESENT
          score += 50 * (6 - currentRowIndex)
        }
      }
    })
    // 3rd pass: mark absent
    currentRow.forEach((tile) => {
      if (!tile.state) {
        tile.state = LetterState.ABSENT
        if (!letterStates[tile.letter]) {
          letterStates[tile.letter] = LetterState.ABSENT

        }
      }
    })

    allowInput = false
    if (currentRow.every((tile) => tile.state === LetterState.CORRECT)) {
      // yay!
      setTimeout(() => {
        grid = genResultGrid()
        showMessage(
          ['عبقري', 'عظيم', 'مثير للإعجاب', 'باهر', 'رائع', 'لابأس'][
          currentRowIndex
          ],
          -1
        )
        success = true
      }, 1600)
    } else if (currentRowIndex < board.length - 1) {
      // go the next row
      currentRowIndex++
      setTimeout(() => {
        allowInput = true
      }, 1600)
    } else {
      // game over :(
      setTimeout(() => {
        showMessage(answer.toUpperCase(), -1)
      }, 1600)
    }
  } else {
    shake()
    showMessage('عدد غير كافي من الحروف')
  }
}

function showMessage(msg: string, time = 1000) {
  message = msg
  if (time > 0) {
    setTimeout(() => {
      message = ''
    }, time)
  }
}

// //watch the message
// watch(() => message, (msg) => {
//   if (msg) {

// })


function shake() {
  shakeRowIndex = currentRowIndex
  setTimeout(() => {
    shakeRowIndex = -1
  }, 1000)
}

const icons = {
  [LetterState.CORRECT]: '🟩',
  [LetterState.PRESENT]: '🟨',
  [LetterState.ABSENT]: '⬜',
  [LetterState.INITIAL]: null
}

function genResultGrid() {
  return board
    .slice(0, currentRowIndex + 1)
    .map((row) => {
      return row.map((tile) => icons[tile.state]).join('')
    })
    .join('\n')
}


let colorMode = $ref('light');

let htmlElem = document.querySelector("html");
//get the color mode from local storage
colorMode=localStorage.getItem('colorMode')??'dark'
htmlElem?.classList[colorMode === 'dark' ? "remove" : "add"]("dark");


function changeColorMode() {
  if (colorMode === 'dark') {
    colorMode = 'light'
  } else {
    colorMode = 'dark'
  }

  //add class dark to html based on the color mode
  
  htmlElem?.classList[colorMode === 'dark' ? "remove" : "add"]("dark");
  localStorage.setItem("colorMode", JSON.stringify(colorMode));


}

let showDropdown = $ref(false);

const toggleDropdown = () => {
  showDropdown = !showDropdown;
}


function restart() {
  currentRowIndex = 0
  currentRow = board[currentRowIndex]
  score = 0
  success = false
  error = false
  letterStates = {}
  allowInput = true
  grid = ''
  message = ''
   board=Array.from({ length: 6 }, () =>
    Array.from({ length: charLength.value }, () => ({
      letter: '',
      state: LetterState.INITIAL
    }))
  )
}
</script>

<style scoped>
#board {
  display: grid;
  grid-template-rows: repeat(bind(gridCols), 1fr);
  grid-gap: 5px;
  padding: 10px;
  box-sizing: border-box;
  --height: min(420px, calc(var(--vh, 100vh) - 310px));
  height: 300px;
  /* width: 256px; */
  max-width: max-content;
  margin: 0px auto;
}
.message {
  position: absolute;
  left: 50%;
  top: 80px;
  /* color: #fff; */
  /* background-color: rgba(0, 0, 0, 0.85); */
  padding: 16px 20px;
  z-index: 2;
  border-radius: 4px;
  transform: translateX(-50%);
  transition: opacity 0.3s ease-out;
  font-weight: 600;
}
.message.v-leave-to {
  opacity: 0;
}
.row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 5px;
}
.tile {
  width: 100%;
  min-width: 40px;
  max-width: 40px;
  font-size: 2rem;
  line-height: 2rem;
  font-weight: bold;
  vertical-align: middle;
  text-transform: uppercase;
  user-select: none;
  position: relative;
}
.tile.filled {
  animation: zoom 0.2s;
}
.tile .front,
.tile .back {
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.tile .front {
  border: 2px solid #d3d6da;
  @apply rounded-md dark:border-gray-500 border-gray-400;
  /* border-style: dashed; */
}
.tile.filled .front {
  border-color: #999;
  border-style: solid;
}
.tile .back {
  transform: rotateX(180deg);
}
.tile.revealed .front {
  transform: rotateX(180deg);
}
.tile.revealed .back {
  transform: rotateX(0deg);
}

@keyframes zoom {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0% {
    transform: translate(1px);
  }
  10% {
    transform: translate(-2px);
  }
  20% {
    transform: translate(2px);
  }
  30% {
    transform: translate(-2px);
  }
  40% {
    transform: translate(2px);
  }
  50% {
    transform: translate(-2px);
  }
  60% {
    transform: translate(2px);
  }
  70% {
    transform: translate(-2px);
  }
  80% {
    transform: translate(2px);
  }
  90% {
    transform: translate(-2px);
  }
  100% {
    transform: translate(1px);
  }
}

.jump .tile .back {
  animation: jump 0.5s;
}

@keyframes jump {
  0% {
    transform: translateY(0px);
  }
  20% {
    transform: translateY(5px);
  }
  60% {
    transform: translateY(-25px);
  }
  90% {
    transform: translateY(3px);
  }
  100% {
    transform: translateY(0px);
  }
}

@media (max-height: 680px) {
  .tile {
    font-size: 3vh;
  }
}
</style>
