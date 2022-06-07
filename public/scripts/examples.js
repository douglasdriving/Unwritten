const actionExamples = [
  'Take a bite out of the apple',
  'Slap the man across his face',
  'Scream for help',
  'Throw yourself into the ocean',
  'Think back to your childhood',
  'Tell the bartender to poor you a glass of red wine',
  'Try to remember what happened yesterday',
  'Ask the woman for directions',
  'Tell everyone about your trip to Zanzibar',
  'Go right',
  'Leave the party',
  'Walk into the store',
  'Ask for the bill',
  'Run away',
  'Prepare your sword for combat'
]

const scenarioExamples = [
  'As you look out into the field, you notice something moving far out in the distance. You cant tell exactly what it is, but you assume it must be an animal.',
  'The girl looks at you with a shocked expression. It seems like she wants to say something, but that she cant find the words that she is looking for.',
  'Alan pats you on the back and says: "Dont worry man! These things happen all the time. Next time you know how to handle it. Its nothing to be ashamed of"',
  'The gang approaches you slowly. They seem aggressive and dangerous. "There is no way I could ever beat them in a fight" - you think to yourself.',
  'As you turn around the corner, a big church appears in front of you. Its a magnificent piece of architechture, and you are quite suprised that you havent seen it before considering its size.',
  'The book contains a bunch of symbols and scribbles that you cant read or make any sense of. It confuses you - you cant make any sense of what the book is about',
  'As you try to sneak through the room, your right shoulder bumps into a large vase. Time seems you stop as you see it fall and hit the ground with a huge cracking noise.',
]

export function GetScenarioExample() {
  return RandomArrayItem(scenarioExamples);
}

export function GetActionExample() {
  return RandomArrayItem(actionExamples);
}

export function GetExample(type){
  if (type==='scenario') return RandomArrayItem(scenarioExamples);
  else if (type==='action') return RandomArrayItem(actionExamples);
}

function RandomArrayItem(array) {
  const numberOfItems = array.length;
  const randomNumber = Math.floor(Math.random() * numberOfItems)
  return array[randomNumber];
}